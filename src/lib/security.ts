import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /ai/i, /gpt/i, /claude/i,
  /perplexity/i, /google-extended/i, /chatgpt/i,
];

export function detectBot(userAgent: string): boolean {
  return BOT_PATTERNS.some((p) => p.test(userAgent));
}

export async function rateLimitCheck(request: NextRequest): Promise<boolean> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `rl:${ip}`;
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 100;

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const { data } = await supabase
      .from("rate_limits")
      .select("count, first_seen")
      .eq("key", key)
      .single();

    if (!data || (now - new Date(data.first_seen).getTime()) > windowMs) {
      await supabase.from("rate_limits").upsert(
        { key, count: 1, first_seen: new Date(now).toISOString() },
        { onConflict: "key" }
      );
      return true;
    }

    if (data.count >= maxRequests) return false;

    await supabase.from("rate_limits").update({ count: data.count + 1, updated_at: new Date().toISOString() }).eq("key", key);
    return true;
  } catch {
    return true; // fail open
  }
}
