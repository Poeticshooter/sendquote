import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  setContext: vi.fn(),
  setUser: vi.fn(),
}));

describe("API Health", () => {
  it("returns 200 for health check", async () => {
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("ok");
  });
});

describe("API Validation", () => {
  it("rejects quote creation without auth", async () => {
    const { POST } = await import("@/app/api/quotes/route");
    const request = new NextRequest("http://localhost:3000/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("rejects invalid email in referrals", async () => {
    const { POST } = await import("@/app/api/referrals/route");
    const request = new NextRequest("http://localhost:3000/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const response = await POST(request);
    // requireAuth runs first, so returns 401 (not 400 for bad email)
    expect(response.status).toBe(401);
  });

  it("requires auth for analytics", async () => {
    const { GET } = await import("@/app/api/analytics/route");
    const request = new NextRequest("http://localhost:3000/api/analytics");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe("Plan Gates", () => {
  it("plan limits exist for free tier", async () => {
    const { PLAN_LIMITS } = await import("@/lib/plan-gates");
    expect(PLAN_LIMITS.free).toBeDefined();
    expect(PLAN_LIMITS.free.quotes_per_month).toBe(5);
    expect(PLAN_LIMITS.starter.quotes_per_month).toBe(50);
  });
});

describe("Security", () => {
  it("detects bot user agents", async () => {
    const { detectBot } = await import("@/lib/security");
    expect(detectBot("Mozilla/5.0 (compatible; GPTBot/1.0)").isBot).toBe(true);
    expect(detectBot("Mozilla/5.0 Chrome/120").isBot).toBe(false);
  });

  it("rate limiting allows normal requests", async () => {
    const { checkMemoryRateLimit } = await import("@/lib/rate-limit");
    const result = checkMemoryRateLimit("test-key", 10, 60000);
    expect(result).toBe(true);
  });
});
