import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { BuyerChatSchema } from "@/lib/api-validation";
import { parseError } from "@/lib/api-helper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_token, message, sender_name } = BuyerChatSchema.parse(body);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
    if (!supabaseAnonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured");

    // Use anon key client so RLS policies (based on public_token) are enforced
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: quote } = await supabase
      .from("quotes")
      .select("id")
      .eq("public_token", public_token)
      .single();

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("deal_room_messages")
      .insert({
        quote_id: quote.id,
        sender_type: "buyer",
        sender_name: sender_name || "Buyer",
        message: message.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return parseError(e);
  }
}
