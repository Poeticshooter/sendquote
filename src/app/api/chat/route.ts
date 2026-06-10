import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ChatMessageSchema } from "@/lib/api-validation";
import { success, parseError, requireAuth } from "@/lib/api-helper";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const quote_id = searchParams.get("quote_id");

    if (!quote_id) {
      return NextResponse.json({ error: "Missing quote_id" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: quote } = await supabase
      .from("quotes")
      .select("user_id")
      .eq("id", quote_id)
      .single();

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    if (quote.user_id !== user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const { data, error } = await supabase
      .from("deal_room_messages")
      .select("*")
      .eq("quote_id", quote_id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return success(data);
  } catch (e) {
    return parseError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { quote_id, message } = ChatMessageSchema.parse(body);

    const supabase = await createClient();

    const { data: quote } = await supabase
      .from("quotes")
      .select("user_id")
      .eq("id", quote_id)
      .single();

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    if (quote.user_id !== user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name")
      .eq("user_id", user.id)
      .single();

    const { data, error } = await supabase
      .from("deal_room_messages")
      .insert({
        quote_id,
        sender_type: "seller",
        sender_name: profile?.business_name || "Seller",
        message: message.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return success(data, 201);
  } catch (e) {
    return parseError(e);
  }
}
