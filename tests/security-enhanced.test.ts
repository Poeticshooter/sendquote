/**
 * SendQuote Security Tests
 * Tests for: Authentication, Authorization, Rate Limiting, CSRF, Input Validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Setup ────────────────────────────────────────────────────────────

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  setContext: vi.fn(),
  setUser: vi.fn(),
}));

// ─── Test: Rate Limiting ───────────────────────────────────────────────────

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("allows request when no prior rate limit record exists", async () => {
    const { checkMemoryRateLimit } = await import("@/lib/rate-limit");
    const result = checkMemoryRateLimit("test-key-1", 10, 60000);
    expect(result).toBe(true);
  });

  it("allows request within limit", async () => {
    const { checkMemoryRateLimit } = await import("@/lib/rate-limit");
    for (let i = 0; i < 9; i++) {
      expect(checkMemoryRateLimit("test-key-2", 10, 60000)).toBe(true);
    }
    expect(checkMemoryRateLimit("test-key-2", 10, 60000)).toBe(true); // 10th
  });

  it("blocks request when limit exceeded", async () => {
    const { checkMemoryRateLimit } = await import("@/lib/rate-limit");
    for (let i = 0; i < 10; i++) {
      checkMemoryRateLimit("test-key-3", 10, 60000);
    }
    expect(checkMemoryRateLimit("test-key-3", 10, 60000)).toBe(false);
  });

  it("resets after window expires", async () => {
    const { checkMemoryRateLimit } = await import("@/lib/rate-limit");
    // Exhaust limit
    for (let i = 0; i < 10; i++) {
      checkMemoryRateLimit("test-key-4", 10, 50);
    }
    expect(checkMemoryRateLimit("test-key-4", 10, 50)).toBe(false);
    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 60));
    expect(checkMemoryRateLimit("test-key-4", 10, 50)).toBe(true);
  }, 200);

  it("different keys have independent limits", async () => {
    const { checkMemoryRateLimit } = await import("@/lib/rate-limit");
    for (let i = 0; i < 10; i++) {
      checkMemoryRateLimit("test-key-5a", 10, 60000);
    }
    expect(checkMemoryRateLimit("test-key-5a", 10, 60000)).toBe(false);
    expect(checkMemoryRateLimit("test-key-5b", 10, 60000)).toBe(true);
  });
});

// ─── Test: Bot Detection ───────────────────────────────────────────────────

describe("Bot Detection", () => {
  it("detects GPTBot as bot", async () => {
    const { detectBot } = await import("@/lib/security");
    const result = detectBot("Mozilla/5.0 (compatible; GPTBot/1.0)");
    expect(result.isBot).toBe(true);
    expect(result.isAiCrawler).toBe(true);
  });

  it("detects PerplexityBot", async () => {
    const { detectBot } = await import("@/lib/security");
    const result = detectBot("Mozilla/5.0 (compatible; PerplexityBot/1.0)");
    expect(result.isBot).toBe(true);
    expect(result.isAiCrawler).toBe(true);
  });

  it("detects Googlebot as verified bot (not AI crawler)", async () => {
    const { detectBot } = await import("@/lib/security");
    const result = detectBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)");
    expect(result.isBot).toBe(true);
    expect(result.isAiCrawler).toBe(false);
  });

  it("allows normal browser user agents", async () => {
    const { detectBot } = await import("@/lib/security");
    const result = detectBot("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0");
    expect(result.isBot).toBe(false);
    expect(result.isAiCrawler).toBe(false);
  });

  it("handles empty user agent", async () => {
    const { detectBot } = await import("@/lib/security");
    const result = detectBot("");
    expect(result.isBot).toBe(false);
    expect(result.isAiCrawler).toBe(false);
  });
});

// ─── Test: CSRF Origin Verification ────────────────────────────────────────

describe("CSRF Protection", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://sendquote.in";
  });

  it("allows requests from own origin", async () => {
    const { verifyOrigin } = await import("@/lib/security/csrf");
    const result = verifyOrigin({
      headers: { get: (name: string) => name === "origin" ? "https://sendquote.in" : null }
    });
    expect(result.ok).toBe(true);
  });

  it("rejects requests without origin", async () => {
    const { verifyOrigin } = await import("@/lib/security/csrf");
    const result = verifyOrigin({
      headers: { get: (_name: string) => null }
    });
    expect(result.ok).toBe(false);
  });

  it("rejects requests from unknown origins", async () => {
    const { verifyOrigin } = await import("@/lib/security/csrf");
    const result = verifyOrigin({
      headers: { get: (name: string) => name === "origin" ? "https://evil.com" : null }
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });

  it("allows requests from localhost in development", async () => {
    const { verifyOrigin } = await import("@/lib/security/csrf");
    const result = verifyOrigin({
      headers: { get: (name: string) => name === "origin" ? "http://localhost:3000" : null }
    });
    expect(result.ok).toBe(true);
  });

  it("uses referrer as fallback when origin is missing", async () => {
    const { verifyOrigin } = await import("@/lib/security/csrf");
    const result = verifyOrigin({
      headers: { get: (name: string) => name === "referer" ? "https://sendquote.in/dashboard" : null }
    });
    expect(result.ok).toBe(true);
  });
});

// ─── Test: Input Validation ────────────────────────────────────────────────

describe("Input Validation", () => {
  it("validates email addresses in API schemas", async () => {
    const { CreateClientSchema } = await import("@/lib/api-validation");
    
    const validResult = CreateClientSchema.safeParse({ name: "Test", email: "test@example.com" });
    expect(validResult.success).toBe(true);

    const invalidResult = CreateClientSchema.safeParse({ name: "Test", email: "not-an-email" });
    expect(invalidResult.success).toBe(false);
  });

  it("validates quote items", async () => {
    const { CreateQuoteSchema } = await import("@/lib/api-validation");
    
    const validQuote = {
      client_name: "Test Client",
      items: [{ description: "Item 1", quantity: 2, rate: 100 }],
    };
    expect(CreateQuoteSchema.safeParse(validQuote).success).toBe(true);

    const invalidQuote = {
      client_name: "",
      items: [],
    };
    const result = CreateQuoteSchema.safeParse(invalidQuote);
    expect(result.success).toBe(false);
  });

  it("validates email format", async () => {
    const { CreateClientSchema } = await import("@/lib/api-validation");
    
    const result = CreateClientSchema.safeParse({ name: "Test", email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("allows empty client email", async () => {
    const { CreateQuoteSchema } = await import("@/lib/api-validation");
    
    const result = CreateQuoteSchema.safeParse({
      client_name: "Test Client",
      items: [{ description: "Item 1", quantity: 1, rate: 100 }],
      client_email: "",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Test: Plan Gates ──────────────────────────────────────────────────────

describe("Plan Gates", () => {
  it("has correct plan limits for all tiers", async () => {
    const { PLAN_LIMITS } = await import("@/lib/plan-limits");
    
    expect(PLAN_LIMITS.free.quotes_per_month).toBe(5);
    expect(PLAN_LIMITS.growth.quotes_per_month).toBe(99999);
    expect(PLAN_LIMITS.pro.quotes_per_month).toBe(99999);
    expect(PLAN_LIMITS.enterprise.quotes_per_month).toBe(999999);
  });

  it("free plan has limited access", async () => {
    const { canAccess } = await import("@/lib/plan-limits");
    
    expect(canAccess("ai_generation", "free")).toBe(false);
    expect(canAccess("crm_sync", "free")).toBe(false);
    expect(canAccess("api_access", "free")).toBe(false);
  });

  it("growth plan has AI generation and CRM sync", async () => {
    const { canAccess } = await import("@/lib/plan-limits");
    
    expect(canAccess("ai_generation", "growth")).toBe(true);
    expect(canAccess("crm_sync", "growth")).toBe(true);
    expect(canAccess("approval_workflows", "growth")).toBe(true);
  });

  it("pro plan has API access and custom branding", async () => {
    const { canAccess } = await import("@/lib/plan-limits");
    
    expect(canAccess("api_access", "pro")).toBe(true);
    expect(canAccess("custom_branding", "pro")).toBe(true);
    expect(canAccess("contract_automation", "pro")).toBe(true);
  });

  it("enterprise plan has all features", async () => {
    const { canAccess } = await import("@/lib/plan-limits");
    
    expect(canAccess("ai_generation", "enterprise")).toBe(true);
    expect(canAccess("crm_sync", "enterprise")).toBe(true);
    expect(canAccess("approval_workflows", "enterprise")).toBe(true);
    expect(canAccess("api_access", "enterprise")).toBe(true);
    expect(canAccess("custom_branding", "enterprise")).toBe(true);
    expect(canAccess("contract_automation", "enterprise")).toBe(true);
  });
});

// ─── Test: Webhook Security ────────────────────────────────────────────────

describe("Webhook Security", () => {
  it("rejects requests with missing webhook secret", async () => {
    const { verifyWebhookSignature } = await import("@/lib/webhook-utils");
    const result = verifyWebhookSignature("", "test-body");
    expect(result).toBe(false);
  });

  it("verifies with provided secret instead of env", async () => {
    const { verifyWebhookSignature } = await import("@/lib/webhook-utils");
    const crypto = await import("crypto");
    const body = JSON.stringify({ event: "payment.captured" });
    const sig = crypto.createHmac("sha256", "explicit-secret").update(body).digest("hex");
    const result = verifyWebhookSignature(sig, body, "explicit-secret");
    expect(result).toBe(true);
  });

  it("rejects request with missing bearer token", async () => {
    const { verifyWebhookBearerToken } = await import("@/lib/webhook-utils");
    const result = verifyWebhookBearerToken("");
    expect(result).toBe(false);
  });
});
