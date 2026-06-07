import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    // Mock process.uptime to return a stable value
    vi.stubGlobal("process", { ...process, uptime: () => 12345 });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("uptime");
    expect(body.uptime).toBe(12345);
  });

  it("returns a valid ISO timestamp", async () => {
    const response = await GET();
    const body = await response.json();

    const timestamp = new Date(body.timestamp);
    expect(timestamp.toISOString()).toBe(body.timestamp);
  });

  it("returns uptime as a number", async () => {
    vi.stubGlobal("process", { ...process, uptime: () => 42 });

    const response = await GET();
    const body = await response.json();

    expect(typeof body.uptime).toBe("number");
    expect(body.uptime).toBe(42);
  });

  it("returns JSON content-type header", async () => {
    const response = await GET();

    expect(response.headers.get("content-type")).toMatch(/application\/json/);
  });

  it("handles concurrent requests", async () => {
    vi.stubGlobal("process", { ...process, uptime: () => 999 });

    const [res1, res2] = await Promise.all([GET(), GET()]);
    const body1 = await res1.json();
    const body2 = await res2.json();

    expect(body1.status).toBe("ok");
    expect(body2.status).toBe("ok");
    expect(body1.uptime).toBe(999);
    expect(body2.uptime).toBe(999);
  });
});
