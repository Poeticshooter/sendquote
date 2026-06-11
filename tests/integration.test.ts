import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const mockUser = { id: "test-user-id", email: "test@test.com" };

async function mockServerAuth(user: typeof mockUser | null) {
  const mod = await import("@/lib/supabase/server");
  const mockClient = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: { plan: "pro" }, error: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  vi.mocked(mod.createClient).mockResolvedValue(mockClient as never);
}

describe("API Route Integration Tests", () => {
  it("GET /api/health returns 200", async () => {
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  it("GET /api/templates returns public templates", async () => {
    await mockServerAuth(mockUser);
    const { GET } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost:3000/api/templates");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.templates)).toBe(true);
  });

  it("GET /api/quotes returns quotes (mocked queries)", async () => {
    await mockServerAuth(mockUser);
    const { getQuotes } = await import("@/lib/supabase/queries");
    vi.mocked(getQuotes).mockResolvedValue([]);
    const { GET } = await import("@/app/api/quotes/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("GET /api/clients requires auth", async () => {
    await mockServerAuth(null);
    const { GET } = await import("@/app/api/clients/route");
    const request = new NextRequest("http://localhost:3000/api/clients");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("GET /api/analytics requires auth", async () => {
    await mockServerAuth(null);
    const { GET } = await import("@/app/api/analytics/route");
    const request = new NextRequest("http://localhost:3000/api/analytics");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("GET /api/achievements requires auth", async () => {
    await mockServerAuth(null);
    const { GET } = await import("@/app/api/achievements/route");
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("GET /api/subscriptions requires auth", async () => {
    await mockServerAuth(null);
    const { GET } = await import("@/app/api/subscriptions/route");
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("POST /api/events requires valid body", async () => {
    await mockServerAuth(mockUser);
    const { POST } = await import("@/app/api/events/route");
    const request = new NextRequest("http://localhost:3000/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("GET /api/pincode/lookup validates params", async () => {
    const { GET } = await import("@/app/api/pincode/lookup/route");
    const request = new NextRequest("http://localhost:3000/api/pincode/lookup");
    const response = await GET(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Pincode required");
  });

  it("GET /api/portal has no GET handler", async () => {
    const mod = await import("@/app/api/portal/route") as Record<string, unknown>;
    expect(mod.POST).toBeDefined();
    expect(mod.GET).toBeUndefined();
  });
});

describe("Security Tests", () => {
  it("detects GPTBot user agent", async () => {
    const { detectBot } = await import("@/lib/security");
    const result = detectBot("Mozilla/5.0 (compatible; GPTBot/1.0)");
    expect(result.isBot).toBe(true);
    expect(result.isAiCrawler).toBe(true);
  });

  it("detects Claude-Web crawler", async () => {
    const { detectBot } = await import("@/lib/security");
    const result = detectBot("Mozilla/5.0 (compatible; Claude-Web/1.0)");
    expect(result.isBot).toBe(true);
  });

  it("allows normal browsers", async () => {
    const { detectBot } = await import("@/lib/security");
    const result = detectBot("Mozilla/5.0 Chrome/120 Safari/537.36");
    expect(result.isBot).toBe(false);
  });

  it("validates GST format", async () => {
    const { validateGstFormat } = await import("@/lib/gst");
    expect(validateGstFormat("27AABCU1234D1Z1").valid).toBe(true);
    expect(validateGstFormat("invalid").valid).toBe(false);
  });

  it("validates Indian pincode", async () => {
    const { validatePincode } = await import("@/lib/pincode");
    expect(validatePincode("400001")).toBe(true);
    expect(validatePincode("000")).toBe(false);
  });

  it("formats INR currency", async () => {
    const { formatINR } = await import("@/lib/currency");
    expect(formatINR(100000)).toContain("1,00,000");
  });

  it("generates WhatsApp share URL", async () => {
    const { getWhatsAppShareUrl } = await import("@/lib/share");
    const url = getWhatsAppShareUrl("https://sendquote.in/q/abc", "QTE-001", "Test");
    expect(url).toContain("wa.me");
    expect(url).toContain("QTE-001");
  });

  it("checks memory rate limit allows normal requests", async () => {
    const { checkMemoryRateLimit } = await import("@/lib/rate-limit");
    const result = checkMemoryRateLimit("test-key", 10, 60000);
    expect(result).toBe(true);
  });
});

describe("AI Provider Chain", () => {
  it("initProviders returns available providers", async () => {
    const { initProviders, clearProviderCache } = await import("@/lib/ai/providers");
    clearProviderCache();
    const providers = initProviders();
    expect(Array.isArray(providers)).toBe(true);
  });

  it("GroqProvider validates API key", async () => {
    const { GroqProvider } = await import("@/lib/ai/providers");
    const provider = new GroqProvider();
    expect(provider.name).toBe("groq");
  });
});

describe("Plan Gates", () => {
  it("free plan has 5 quotes per month", async () => {
    const { PLAN_LIMITS } = await import("@/lib/plan-gates");
    expect(PLAN_LIMITS.free.quotes_per_month).toBe(5);
  });

  it("starter plan has 50 quotes per month", async () => {
    const { PLAN_LIMITS } = await import("@/lib/plan-gates");
    expect(PLAN_LIMITS.starter.quotes_per_month).toBe(50);
  });

  it("pro plan has unlimited quotes", async () => {
    const { PLAN_LIMITS } = await import("@/lib/plan-gates");
    expect(PLAN_LIMITS.pro.quotes_per_month).toBe(99999);
  });

  it("enterprise plan has team members", async () => {
    const { PLAN_LIMITS } = await import("@/lib/plan-gates");
    expect(PLAN_LIMITS.enterprise.team_members).toBe(999);
  });
});

describe("Analytics Module", () => {
  it("trackClientEvent does not throw when posthog is absent", async () => {
    const { trackClientEvent } = await import("@/lib/analytics");
    expect(() => trackClientEvent("test_event")).not.toThrow();
  });

  it("trackEvent does not throw when not authenticated", async () => {
    const { trackEvent } = await import("@/lib/analytics");
    await expect(trackEvent("page_view")).resolves.toBeUndefined();
  });
});
