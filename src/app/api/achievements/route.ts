import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { success, parseError, requireAuth } from "@/lib/api-helper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const admin = createAdminClient();

    const [{ data: definitions }, { data: earned }, { data: profile }] = await Promise.all([
      admin.from("achievement_definitions").select("*"),
      supabase.from("user_achievements").select("*").eq("user_id", user.id),
      supabase.from("profiles").select("monthly_quote_count").eq("user_id", user.id).single(),
    ]);

    return success({ definitions: definitions || [], earned: earned || [], monthlyCount: profile?.monthly_quote_count || 0 });
  } catch (e) {
    return parseError(e);
  }
}
