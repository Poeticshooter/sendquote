import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const admin = createAdminClient();
    const { count: userCount } = await admin.from("profiles").select("*", { count: "exact", head: true });
    const { count: quoteCount } = await admin.from("quotes").select("*", { count: "exact", head: true });
    const { count: auditLogCount } = await admin.from("admin_audit_log").select("*", { count: "exact", head: true });
    const { count: errorCount } = await admin.from("error_logs").select("*", { count: "exact", head: true });

    return NextResponse.json({ userCount: userCount || 0, quoteCount: quoteCount || 0, auditLogCount: auditLogCount || 0, errorCount: errorCount || 0 });
  } catch {
    return NextResponse.json({ userCount: 0, quoteCount: 0, auditLogCount: 0, errorCount: 0 });
  }
}
