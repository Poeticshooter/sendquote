import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quote_id = searchParams.get("quote_id");

    if (!quote_id) {
      return NextResponse.json({ error: "Missing quote_id" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("deal_room_messages")
      .select("*")
      .eq("quote_id", quote_id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { quote_id, message } = await request.json();

    if (!quote_id || !message?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
