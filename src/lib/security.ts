import type { NextRequest } from "next/server";

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

interface RateLimitStore {
  count: number;
  firstSeen: number;
}

const localRateLimitCache = new Map<string, RateLimitStore>();
const CACHE_MAX_ENTRIES = 10000;

function checkLocalRateLimit(key: string, windowMs: number, maxRequests: number): boolean {
  const now = Date.now();
  // Clean expired entries on each access (serverless-friendly, no setInterval)
  for (const [k, entry] of localRateLimitCache) {
    if ((now - entry.firstSeen) > windowMs) {
      localRateLimitCache.delete(k);
    }
  }

  const entry = localRateLimitCache.get(key);

  if (!entry || (now - entry.firstSeen) > windowMs) {
    if (localRateLimitCache.size >= CACHE_MAX_ENTRIES) {
      const oldest = localRateLimitCache.keys().next().value;
      if (oldest) localRateLimitCache.delete(oldest);
    }
    localRateLimitCache.set(key, { count: 1, firstSeen: now });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  entry.count += 1;
  return true;
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

    const { data } = await supabase
      .from("rate_limits")
      .select("count, first_seen")
      .eq("key", key)
      .maybeSingle();

    if (!data || (Date.now() - new Date(data.first_seen).getTime()) > windowMs) {
      await supabase.from("rate_limits").upsert(
        { key, count: 1, first_seen: new Date().toISOString() },
        { onConflict: "key" }
      );
      return true;
    }

    if (data.count >= maxRequests) return false;

    await supabase
      .from("rate_limits")
      .update({ count: data.count + 1, updated_at: new Date().toISOString() })
      .eq("key", key);
    return true;
  } catch {
    return checkLocalRateLimit(key, windowMs, maxRequests);
  }
}
