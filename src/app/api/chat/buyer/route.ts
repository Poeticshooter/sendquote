import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { public_token, message, sender_name } = await request.json();
    if (!public_token || !message?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createAdminClient();
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
