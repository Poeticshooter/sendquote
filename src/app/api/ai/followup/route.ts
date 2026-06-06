import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFollowUp, FollowUpInput } from "@/lib/ai/followup";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { quote_id } = await request.json();
    if (!quote_id) return NextResponse.json({ error: "Missing quote_id" }, { status: 400 });

    const { data: quote } = await supabase
      .from("quotes")
      .select("*, profiles!inner(business_name)")
      .eq("id", quote_id)
      .single();

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    const { data: events } = await supabase
      .from("quote_events")
      .select("event_type")
      .eq("quote_id", quote_id);

    const viewedEvents = events?.filter((e: any) => e.event_type === "viewed") || [];
    const viewedCount = viewedEvents.length;
    const daysSinceSent = quote.sent_at
      ? Math.floor((Date.now() - new Date(quote.sent_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const input: FollowUpInput = {
      clientName: quote.client_name,
      quoteNumber: quote.quote_number,
      total: quote.total,
      status: quote.status,
      daysSinceSent,
      viewedCount,
      sectionsViewed: [],
      businessName: (quote as any).profiles?.business_name || "SendQuote",
    };

    const result = await generateFollowUp(input);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
