import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseError, requireAuth } from "@/lib/api-helper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    if (!profile || (profile.plan !== "enterprise" && profile.plan !== "pro")) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { count: userCount } = await admin.from("profiles").select("*", { count: "exact", head: true });
    const { count: quoteCount } = await admin.from("quotes").select("*", { count: "exact", head: true });
    const { count: auditLogCount } = await admin.from("admin_audit_log").select("*", { count: "exact", head: true });
    const { count: errorCount } = await admin.from("error_logs").select("*", { count: "exact", head: true });

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
