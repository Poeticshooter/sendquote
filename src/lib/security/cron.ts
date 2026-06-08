import { timingSafeEqual } from "crypto";

/**
 * Verify the CRON_SECRET authorization header using timing-safe comparison.
 * Used by cron job endpoints to authenticate requests.
 */
export function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization") || "";
  const expectedToken = process.env.CRON_SECRET;
  if (!expectedToken) return false;
  const expected = `Bearer ${expectedToken}`;
  if (authHeader.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}
