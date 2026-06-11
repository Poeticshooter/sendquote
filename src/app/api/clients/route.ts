import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { CreateClientSchema } from "@/lib/api-validation";
import { success, parseError, requireAuth } from "@/lib/api-helper";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50")));
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from("clients")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    return success({
      clients: data,
      pagination: {
        total: count || 0,
        page,
        pageSize,
        hasMore: offset + pageSize < (count || 0),
      },
    });
  } catch (e) {
    Sentry.captureException(e);
    return parseError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = CreateClientSchema.parse(body);

    const supabase = await createClient();

    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        user_id: user.id,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        gst_number: data.gst_number || null,
        notes: data.notes || null,
        organization_id: data.organization_id || null,
      })
      .select()
      .single();

    if (error) throw error;
    return success(client, 201);
  } catch (e) {
    Sentry.captureException(e);
    return parseError(e);
  }
}
