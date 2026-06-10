import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { success, parseError, requireAuth } from "@/lib/api-helper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const industry = searchParams.get("industry");

    let query = supabase.from("quote_templates").select("*").order("name");
    if (industry) query = query.eq("industry", industry);

    const { data } = await query;
    return success({ templates: data || [] });
  } catch (e) {
    return parseError(e);
  }
}
