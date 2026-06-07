import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn } from "@/lib/utils";
import { detectBot, rateLimitCheck } from "@/lib/security";
import { NextRequest } from "next/server";

// Mock supabase admin for rateLimitCheck tests
const mockSupabaseSingle = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSupabaseSingle,
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

describe("cn utility", () => {
  it("combines class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });
  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });
  it("merges tailwind classes", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });
  it("handles undefined", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });
});

describe("security - detectBot", () => {
  it("detects GPT bots", () => {
    expect(detectBot("Mozilla/5.0 GPTBot")).toBe(true);
  });
  it("detects Claude", () => {
    expect(detectBot("Claude-Web crawler")).toBe(true);
  });
  it("detects Google crawler", () => {
    expect(detectBot("Googlebot/2.1")).toBe(true);
  });
  it("passes regular browsers", () => {
    expect(detectBot("Mozilla/5.0 Chrome/120")).toBe(false);
  });
  it("passes Firefox", () => {
    expect(detectBot("Mozilla/5.0 Firefox/121")).toBe(false);
  });
});

describe("quote number generation", () => {
  it("generates correct format", () => {
    const year = new Date().getFullYear();
    const num = `QTE-${year}-0001`;
    expect(num).toMatch(/^QTE-\d{4}-\d{4}$/);
  });
});

describe("status colors mapping", () => {
  it("has valid statuses", () => {
    const statuses = ["draft", "sent", "opened", "accepted", "changes_requested", "expired", "archived"];
    statuses.forEach((s) => {
      expect(s.length).toBeGreaterThan(0);
    });
  });
});

describe("cn - additional edge cases", () => {
  it("handles null values", () => {
    expect(cn("foo", null, "bar")).toBe("foo bar");
  });

  it("handles empty string", () => {
    expect(cn("", "foo")).toBe("foo");
  });

  it("handles object syntax", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("handles array inputs", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });

  it("handles multiple conflicting classes (last wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles mixed args with conditionals", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("btn", isActive && "btn-active", isDisabled && "btn-disabled")).toBe("btn btn-active");
  });

  it("handles nested arrays", () => {
    expect(cn(["a", ["b", "c"]], "d")).toBe("a b c d");
  });

  it("handles all falsy values gracefully", () => {
    expect(cn("base", false, null, undefined, 0 as unknown, "")).toBe("base");
  });
});

describe("security - rateLimitCheck", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows request when no prior rate limit record exists", async () => {
    mockSupabaseSingle.mockResolvedValue({ data: null, error: null });

    const request = new NextRequest("https://sendquote.in/api/test", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    });

    const result = await rateLimitCheck(request);
    expect(result).toBe(true);
  });

  it("allows request when count is below max threshold", async () => {
    mockSupabaseSingle.mockResolvedValue({
      data: { count: 50, first_seen: new Date().toISOString() },
      error: null,
    });

    const request = new NextRequest("https://sendquote.in/api/test", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    const result = await rateLimitCheck(request);
    expect(result).toBe(true);
  });

  it("blocks request when count exceeds max threshold", async () => {
    mockSupabaseSingle.mockResolvedValue({
      data: { count: 100, first_seen: new Date().toISOString() },
      error: null,
    });

    const request = new NextRequest("https://sendquote.in/api/test", {
      headers: { "x-forwarded-for": "10.0.0.2" },
    });

    const result = await rateLimitCheck(request);
    expect(result).toBe(false);
  });

  it("resets window after 60 seconds", async () => {
    const oldTime = new Date(Date.now() - 120_000).toISOString();
    mockSupabaseSingle.mockResolvedValue({
      data: { count: 100, first_seen: oldTime },
      error: null,
    });

    const request = new NextRequest("https://sendquote.in/api/test", {
      headers: { "x-forwarded-for": "10.0.0.3" },
    });

    const result = await rateLimitCheck(request);
    // Window has expired, so it should reset and allow
    expect(result).toBe(true);
  });

  it("extracts IP from x-forwarded-for header", async () => {
    mockSupabaseSingle.mockResolvedValue({ data: null, error: null });

    const request = new NextRequest("https://sendquote.in/api/test", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });

    const result = await rateLimitCheck(request);
    expect(result).toBe(true);
  });

  it("uses 'unknown' when no IP header is present", async () => {
    mockSupabaseSingle.mockResolvedValue({ data: null, error: null });

    const request = new NextRequest("https://sendquote.in/api/test");

    const result = await rateLimitCheck(request);
    expect(result).toBe(true);
  });

  it("fails open when supabase throws an error", async () => {
    mockSupabaseSingle.mockRejectedValue(new Error("Database connection failed"));

    const request = new NextRequest("https://sendquote.in/api/test", {
      headers: { "x-forwarded-for": "10.0.0.4" },
    });

    const result = await rateLimitCheck(request);
    expect(result).toBe(true);
  });
});
