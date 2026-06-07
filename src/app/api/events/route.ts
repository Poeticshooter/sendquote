import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { quote_id, event_type, metadata } = await request.json();
    if (!quote_id || !event_type) {
      return NextResponse.json({ error: "Missing quote_id or event_type" }, { status: 400 });
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const { data: quote } = await supabase
      .from("quotes")
      .select("public_token, status")
      .eq("id", quote_id)
      .maybeSingle();

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const ua = request.headers.get("user-agent") || "";
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
    const deviceType = /mobile/i.test(ua) ? "mobile" : /tablet/i.test(ua) ? "tablet" : "desktop";

    const { data, error } = await supabase
      .from("quote_events")
      .insert({
        quote_id,
        event_type,
        ip,
        user_agent: ua.slice(0, 255),
        device_type: deviceType,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    if ((event_type === "viewed" || event_type === "pricing_viewed") && quote.status === "sent") {
      await supabase
        .from("quotes")
        .update({ status: "opened", updated_at: new Date().toISOString() })
        .eq("id", quote_id)
        .eq("status", "sent");
    }

    return NextResponse.json({ success: true, event: data });
  } catch (error: unknown) {
    console.error("Events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
