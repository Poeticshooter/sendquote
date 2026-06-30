/**
 * Webhook Security Utilities
 * HMAC signature verification with timing-safe comparison
 */

import { timingSafeEqual } from "crypto";
import { createHmac } from "crypto";

/**
 * Verifies a webhook HMAC-SHA256 signature using timing-safe comparison.
 * Protects against timing attacks by using crypto.timingSafeEqual.
 */
export function verifyWebhookSignature(
  signature: string,
  body: string,
  secret?: string,
): boolean {
  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret || !signature || !body) return false;

  try {
    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) return false;

    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Verifies a bearer token using timing-safe comparison.
 * Used for internal webhooks (n8n, cron, etc.)
 */
export function verifyWebhookBearerToken(
  authHeader: string,
  expectedToken?: string,
): boolean {
  const token = expectedToken || process.env.CRON_SECRET;
  if (!token || !authHeader) return false;

  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    const tokenBuffer = Buffer.from(bearerToken);
    const expectedBuffer = Buffer.from(token);

    if (tokenBuffer.length !== expectedBuffer.length) return false;

    return timingSafeEqual(tokenBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
