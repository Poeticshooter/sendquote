import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { CreateClientSchema } from "@/lib/api-validation";
import { success, parseError, requireAuth } from "@/lib/api-helper";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return success(data);
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
