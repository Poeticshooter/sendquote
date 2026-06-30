import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseError, requireAuth } from "@/lib/api-helper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();

    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.length === 0 || !adminEmails.includes(user.email?.toLowerCase() || "")) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { count: userCount } = await admin.from("profiles").select("*", { count: "exact", head: true });
    const { count: quoteCount } = await admin.from("quotes").select("*", { count: "exact", head: true });
    const { count: auditLogCount } = await admin.from("admin_audit_log").select("*", { count: "exact", head: true });
    const { count: errorCount } = await admin.from("error_logs").select("*", { count: "exact", head: true });

    // Audit log this access
    await admin.from("admin_audit_log").insert({
      admin_action: "view_admin_stats",
      target_type: "system",
      details: { userId: user.id, userCount, quoteCount },
    });

    return NextResponse.json({
      userCount: userCount || 0,
      quoteCount: quoteCount || 0,
      auditLogCount: auditLogCount || 0,
      errorCount: errorCount || 0,
    });
  } catch (e) {
    return parseError(e);
  }
}
