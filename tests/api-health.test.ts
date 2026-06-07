import { describe, it, expect, vi, beforeAll } from "vitest";
import { NextRequest } from "next/server";

describe("Health API", () => {
  beforeAll(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");
  });

  it("returns 200 with status ok", async () => {
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
  });

  it("returns valid ISO timestamp", async () => {
    const { GET } = await import("@/app/api/health/route");
    const data = await (await GET()).json();

    expect(() => new Date(data.timestamp)).not.toThrow();
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  it("returns uptime as a number", async () => {
    const { GET } = await import("@/app/api/health/route");
    const data = await (await GET()).json();

    expect(typeof data.uptime).toBe("number");
    expect(data.uptime).toBeGreaterThanOrEqual(0);
  });

  it("returns JSON content type", async () => {
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.headers.get("content-type")).toContain("application/json");
  });
});
