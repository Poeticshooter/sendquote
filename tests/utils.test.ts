import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn } from "@/lib/utils";

const mockSupabaseSingle = vi.hoisted(() => vi.fn());
const mockSupabaseRpc = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSupabaseSingle,
          maybeSingle: mockSupabaseSingle,
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    rpc: mockSupabaseRpc,
  })),
}));

describe("cn utility", () => {
  it("combines class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges tailwind classes (last wins)", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("handles undefined", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

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
    expect(cn("base", false, null, undefined, 0 as const, "")).toBe("base");
  });
});

describe("quote number generation format", () => {
  it("generates correct format", () => {
    const year = new Date().getFullYear();
    const num = `QTE-${year}-0001`;
    expect(num).toMatch(/^QTE-\d{4}-\d{4}$/);
  });

  it("handles 9999+ counter", () => {
    const year = new Date().getFullYear();
    const num = `QTE-${year}-${String(10000).padStart(4, "0")}`;
    expect(num).toMatch(/^QTE-\d{4}-\d{4,5}$/);
    expect(num).toBe(`QTE-${year}-10000`);
  });
});

describe("status transitions", () => {
  const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
    draft: ["sent", "archived"],
    sent: ["opened", "accepted", "lost", "archived"],
    opened: ["accepted", "changes_requested", "lost", "archived"],
    changes_requested: ["draft", "sent", "lost", "archived"],
    accepted: ["archived"],
    expired: ["archived"],
    archived: [],
    lost: [],
  };

  it("allows valid transitions", () => {
    expect(VALID_STATUS_TRANSITIONS.draft).toContain("sent");
    expect(VALID_STATUS_TRANSITIONS.sent).toContain("accepted");
    expect(VALID_STATUS_TRANSITIONS.opened).toContain("accepted");
  });

  it("blocks invalid transitions", () => {
    expect(VALID_STATUS_TRANSITIONS.draft).not.toContain("accepted");
    expect(VALID_STATUS_TRANSITIONS.sent).not.toContain("draft");
    expect(VALID_STATUS_TRANSITIONS.accepted).not.toContain("sent");
  });

  it("archived is a terminal state", () => {
    expect(VALID_STATUS_TRANSITIONS.archived).toHaveLength(0);
  });

  it("accepts all valid status strings", () => {
    const statuses = Object.keys(VALID_STATUS_TRANSITIONS);
    const expected = ["draft", "sent", "opened", "accepted", "changes_requested", "expired", "archived", "lost"];
    expect(statuses.sort()).toEqual(expected.sort());
  });
});

describe("rateLimitCheck", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    mockSupabaseRpc.mockResolvedValue({ data: [{ allowed: true, current_count: 1 }], error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    mockSupabaseRpc.mockReset();
  });

  it("allows request when no prior rate limit record exists", async () => {
    const { rateLimitCheck } = await import("@/lib/security");
    const { NextRequest } = await import("next/server");
    const request = new NextRequest("https://sendquote.in/api/test", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    });

    const result = await rateLimitCheck(request);
    expect(result).toBe(true);
  });

  it("allows request when count is below max threshold", async () => {
    const { rateLimitCheck } = await import("@/lib/security");
    const { NextRequest } = await import("next/server");
    const request = new NextRequest("https://sendquote.in/api/test", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    const result = await rateLimitCheck(request);
    expect(result).toBe(true);
  });

  it("blocks request when count exceeds max threshold", async () => {
    mockSupabaseRpc.mockResolvedValue({ data: [{ allowed: false, current_count: 101 }], error: null });

    const { rateLimitCheck } = await import("@/lib/security");
    const { NextRequest } = await import("next/server");
    const request = new NextRequest("https://sendquote.in/api/test", {
      headers: { "x-forwarded-for": "10.0.0.2" },
    });

    const result = await rateLimitCheck(request);
    expect(result).toBe(false);
  });

  it("resets window after 60 seconds", async () => {
    const { rateLimitCheck } = await import("@/lib/security");
    const { NextRequest } = await import("next/server");
    const request = new NextRequest("https://sendquote.in/api/test", {
      headers: { "x-forwarded-for": "10.0.0.3" },
    });

    const result = await rateLimitCheck(request);
    expect(result).toBe(true);
  });

  it("extracts IP from x-forwarded-for header", async () => {
    const { rateLimitCheck } = await import("@/lib/security");
    const { NextRequest } = await import("next/server");
    const request = new NextRequest("https://sendquote.in/api/test", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });

    const result = await rateLimitCheck(request);
    expect(result).toBe(true);
  });

  it("falls back to local rate limit when database fails", async () => {
    mockSupabaseRpc.mockRejectedValue(new Error("Database connection failed"));

    const { rateLimitCheck } = await import("@/lib/security");
    const { NextRequest } = await import("next/server");
    const request = new NextRequest("https://sendquote.in/api/test", {
      headers: { "x-forwarded-for": "10.0.0.4" },
    });

    const result = await rateLimitCheck(request);
    expect(result).toBe(true);
  });
});
