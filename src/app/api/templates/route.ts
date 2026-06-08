import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { success, parseError } from "@/lib/api-helper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get("industry");
    const admin = createAdminClient();

    let query = admin.from("quote_templates").select("*").order("name");
    if (industry) query = query.eq("industry", industry);

    const { data } = await query;
    return success({ templates: data || [] });
  } catch (e) {
    return parseError(e);
  }
}
