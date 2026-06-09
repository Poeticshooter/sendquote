import type { NextRequest } from "next/server";
import { checkMemoryRateLimit } from "@/lib/rate-limit";

const BOT_PATTERNS = [
  /Googlebot/i, /bingbot/i, /BingPreview/i, /Slurp/i, /DuckDuckBot/i,
  /Baiduspider/i, /YandexBot/i, /facebookexternalhit/i, /Twitterbot/i,
  /LinkedInBot/i, /Applebot/i, /WhatsApp/i, /TelegramBot/i,
  /Discordbot/i, /Slackbot/i, /SkypeUriPreview/i,
  /GPTBot/i, /ChatGPT-User/i, /Claude-Web/i, /PerplexityBot/i,
  /Google-Extended/i, /CCBot/i,
  /SemrushBot/i, /AhrefsBot/i, /MJ12bot/i, /DotBot/i,
  /crawler/i, /spider/i, /scraper/i, /Wget/i, /curl/i,
];

const AI_CRAWLER_PATTERNS = [
  /GPTBot/i, /ChatGPT-User/i, /Claude-Web/i, /PerplexityBot/i,
  /Google-Extended/i, /CCBot/i,
];

export function detectBot(userAgent: string): { isBot: boolean; isAiCrawler: boolean } {
  const isAiCrawler = AI_CRAWLER_PATTERNS.some((p) => p.test(userAgent));
  const isBot = BOT_PATTERNS.some((p) => p.test(userAgent));
  return { isBot, isAiCrawler };
}

export async function rateLimitCheck(request: NextRequest): Promise<boolean> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
  const key = `rl:${ip}`;
  const windowMs = 60_000;
  const maxRequests = 100;

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    // Atomic rate limit check via PostgreSQL RPC (no read-then-write race condition)
    const { data, error } = await supabase.rpc("increment_rate_limit", {
      p_key: key,
      p_max_requests: maxRequests,
      p_window_ms: windowMs,
    });

    if (error) throw error;
    return data?.[0]?.allowed ?? false;
  } catch {
    return checkMemoryRateLimit(key, maxRequests, windowMs);
  }
}
