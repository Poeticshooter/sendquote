import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { quote_id } = await request.json();
    if (!quote_id) return NextResponse.json({ error: "Missing quote_id" }, { status: 400 });

    const { data: quote } = await supabase
      .from("quotes")
      .select("*, quote_events(*)")
      .eq("id", quote_id)
      .single();

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    const events = (quote as any).quote_events || [];
    const viewedCount = events.filter((e: any) => e.event_type === "viewed").length;
    const daysSinceCreation = Math.floor((Date.now() - new Date(quote.created_at).getTime()) / (1000 * 60 * 60 * 24));

    const suggestions: { type: string; message: string; priority: "high" | "medium" | "low" }[] = [];

    if (quote.status === "draft") {
      suggestions.push({ type: "action", message: "This quote is still in draft. Send it to your client to start the deal.", priority: "high" });
    }

    if (quote.status === "sent" && daysSinceCreation > 3) {
      suggestions.push({ type: "follow_up", message: `Sent ${daysSinceCreation} days ago with no response. Send a follow-up.`, priority: "high" });
    }

    if (quote.status === "opened" && viewedCount > 2) {
      suggestions.push({ type: "alert", message: `Client viewed this quote ${viewedCount} times. Call them now.`, priority: "high" });
    }

    if (quote.status === "accepted" && !(quote as any).invoices?.length) {
      suggestions.push({ type: "action", message: "Quote accepted! Generate an invoice to collect payment.", priority: "high" });
    }

    if (daysSinceCreation > 14 && quote.status !== "accepted" && quote.status !== "lost") {
      suggestions.push({ type: "risk", message: "This quote is over 2 weeks old. Consider following up or marking as lost.", priority: "medium" });
    }

    if (viewedCount === 0 && quote.status === "sent") {
      suggestions.push({ type: "tip", message: "Client hasn't opened this quote yet. Try sending via WhatsApp for faster visibility.", priority: "low" });
    }

    return NextResponse.json({
      quoteNumber: quote.quote_number,
      daysSinceCreation,
      viewedCount,
      suggestions,
      score: quote.status === "accepted" ? 90 : quote.status === "opened" ? 60 : quote.status === "sent" ? 30 : 10,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
