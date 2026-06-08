/**
 * Shared in-memory rate limiter for serverless environments.
 * Cleans expired entries on each access (no setInterval).
 */
const stores = new Map<string, { count: number; resetAt: number }>();

export function checkMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();

  // Clean expired entries on each access
  for (const [k, entry] of stores) {
    if (now > entry.resetAt) {
      stores.delete(k);
    }
  }

  const entry = stores.get(key);
  if (!entry || now > entry.resetAt) {
    stores.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  entry.count++;
  return true;
}
