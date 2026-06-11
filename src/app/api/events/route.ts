import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { checkMemoryRateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/api-helper";

const VALID_EVENTS = ["viewed", "pricing_viewed", "signed", "paid", "expired", "downloaded"] as const;

const eventSchema = z.object({
  quote_id: z.string().min(1).max(100),
  event_type: z.string().refine((v) => VALID_EVENTS.includes(v as typeof VALID_EVENTS[number]), {
    message: "Invalid event type",
  }),
  metadata: z.any().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkMemoryRateLimit(ip, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const user = await requireAuth();

    const body = await request.json();
    const result = eventSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { quote_id, event_type, metadata } = result.data;
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const { data: quote } = await supabase
      .from("quotes")
      .select("public_token, status, user_id")
      .eq("id", quote_id)
      .maybeSingle();

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Ownership check: only the quote owner can fire events
    if (quote.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const ua = request.headers.get("user-agent") || "";
    const deviceType = /mobile/i.test(ua) ? "mobile" : /tablet/i.test(ua) ? "tablet" : "desktop";

    const { error } = await supabase
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

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Events error:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
