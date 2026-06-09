import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { generateFollowUp, FollowUpInput } from "@/lib/ai/followup";
import { AIFollowupSchema } from "@/lib/api-validation";
import { parseError, success, requireAuth } from "@/lib/api-helper";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { quote_id } = AIFollowupSchema.parse(body);

    const supabase = await createClient();

    const { data: quote } = await supabase
      .from("quotes")
      .select("*, profiles!inner(business_name)")
      .eq("id", quote_id)
      .eq("user_id", user.id)
      .single();

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    type QuoteWithProfile = typeof quote & { profiles: { business_name: string } | null };
    const q = quote as QuoteWithProfile;

    const { data: events } = await supabase
      .from("quote_events")
      .select("event_type")
      .eq("quote_id", quote_id);

    const viewedEvents = events?.filter((e: { event_type: string }) => e.event_type === "viewed") || [];
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
      businessName: q.profiles?.business_name || "SendQuote",
    };

    const result = await generateFollowUp(input);
    return success(result);
  } catch (e) {
    Sentry.captureException(e);
    return parseError(e);
  }
}
