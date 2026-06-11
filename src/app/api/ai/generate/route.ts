import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { generateQuoteAI } from "@/lib/ai/generate-quote";
import { AIGenerateSchema } from "@/lib/api-validation";
import { requireAuth, parseError, success } from "@/lib/api-helper";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/plan-limits";
import type { PlanTier } from "@/lib/plan-limits";
import { checkMemoryRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Per-user AI rate limit: 20 requests per minute
    if (!checkMemoryRateLimit(`ai:${user.id}`, 20, 60_000)) {
      return new Response(JSON.stringify({ error: "Too many AI requests. Please wait." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check plan gate — free users cannot use AI generation
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const plan = (profile?.plan || "free") as PlanTier;
    if (!canAccess("ai_generation", plan)) {
      return new Response(JSON.stringify({ error: "AI generation not available on your plan" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { description } = AIGenerateSchema.parse(body);
    const result = await generateQuoteAI(description);
    return success(result);
  } catch (e) {
    Sentry.captureException(e);
    return parseError(e);
  }
}
