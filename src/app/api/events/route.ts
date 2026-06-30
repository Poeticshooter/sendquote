import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { checkMemoryRateLimit } from "@/lib/rate-limit";

const VALID_EVENTS = ["viewed", "pricing_viewed", "signed", "paid", "expired", "downloaded"] as const;

const eventSchema = z.object({
  quote_id: z.string().min(1).max(100).optional(),
  public_token: z.string().min(1).max(200).optional(),
  event_type: z.string().refine((v) => VALID_EVENTS.includes(v as typeof VALID_EVENTS[number]), {
    message: "Invalid event type",
  }),
  metadata: z.any().optional(),
}).refine((data) => data.quote_id || data.public_token, {
  message: "Either quote_id or public_token is required",
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkMemoryRateLimit(ip, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const result = eventSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { quote_id, public_token, event_type, metadata } = result.data;
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    let resolvedQuoteId = quote_id;

    // If public_token is provided, resolve it to a quote_id (buyer tracking, no auth required)
    if (public_token) {
      const { data: tokenQuote } = await supabase
        .from("quotes")
        .select("id, status")
        .eq("public_token", public_token)
        .maybeSingle();

      if (!tokenQuote) {
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      }
      resolvedQuoteId = tokenQuote.id;
    }

    // If only quote_id (no public_token), require auth + ownership
    if (!public_token && quote_id) {
      const { requireAuth } = await import("@/lib/api-helper");
      const user = await requireAuth();

      const { data: quote } = await supabase
        .from("quotes")
        .select("user_id, status")
        .eq("id", quote_id)
        .maybeSingle();

      if (!quote) {
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      }
      if (quote.user_id !== user.id) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
    }

    if (!resolvedQuoteId) {
      return NextResponse.json({ error: "Could not resolve quote" }, { status: 400 });
    }

    const ua = request.headers.get("user-agent") || "";
    const deviceType = /mobile/i.test(ua) ? "mobile" : /tablet/i.test(ua) ? "tablet" : "desktop";

    const { data: currentQuote } = await supabase
      .from("quotes")
      .select("status")
      .eq("id", resolvedQuoteId)
      .single();

    const { error } = await supabase
      .from("quote_events")
      .insert({
        quote_id: resolvedQuoteId,
        event_type,
        ip,
        user_agent: ua.slice(0, 255),
        device_type: deviceType,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    if ((event_type === "viewed" || event_type === "pricing_viewed") && currentQuote?.status === "sent") {
      await supabase
        .from("quotes")
        .update({ status: "opened", updated_at: new Date().toISOString() })
        .eq("id", resolvedQuoteId)
        .eq("status", "sent");
    }

    // Telegram notification for views (non-blocking)
    if (event_type === "viewed" && resolvedQuoteId) {
      import("@/lib/telegram/notify").then(({ notifyQuoteViewed }) =>
        notifyQuoteViewed(resolvedQuoteId)
      ).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Events error:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
