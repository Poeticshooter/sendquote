import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const originalFetch = global.fetch;

describe("generateQuoteAI", () => {
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "placeholder");
    vi.stubEnv("MISTRAL_API_KEY", "placeholder");
    vi.stubEnv("OPENROUTER_API_KEY", "placeholder");
    vi.stubEnv("CEREBRAS_API_KEY", "placeholder");
    vi.stubEnv("GEMINI_API_KEY", "placeholder");
    vi.stubEnv("GROQ_MODEL", "llama-3.3-70b-versatile");
    // Clear module cache so each test gets a fresh aiProviders
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("falls back to templates when GROQ_API_KEY is placeholder", async () => {
    const { generateQuoteAI } = await import("@/lib/ai/generate-quote");
    const result = await generateQuoteAI("website design for a small business");
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.subtotal).toBeGreaterThan(0);
    expect(result.notes).toBeTruthy();
    expect(result.terms).toBeTruthy();
  });

  it("falls back to template on API error", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { generateQuoteAI } = await import("@/lib/ai/generate-quote");
    const result = await generateQuoteAI("software development project");

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.subtotal).toBeGreaterThan(0);
  });

  it("calls Groq API and parses response", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            items: [
              { description: "Frontend Development", quantity: 1, rate: 80000 },
              { description: "Backend Development", quantity: 1, rate: 80000 },
            ],
            notes: "Includes 2 rounds of revisions.",
            terms: "50% advance, 50% on completion.",
          }),
        },
      }],
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse),
      ok: true,
    });

    const { generateQuoteAI } = await import("@/lib/ai/generate-quote");
    const result = await generateQuoteAI("build a SaaS platform");

    expect(result.items.length).toBe(2);
    expect(result.subtotal).toBe(160000);
    expect(result.notes).toContain("revisions");
  });

  it("detects different industries from description", async () => {
    const { generateQuoteAI } = await import("@/lib/ai/generate-quote");
    const consulting = await generateQuoteAI("business consulting for growth");
    expect(consulting.items.length).toBeGreaterThan(0);
    expect(consulting.subtotal).toBeGreaterThan(0);

    const marketing = await generateQuoteAI("social media marketing campaign");
    expect(marketing.items.length).toBeGreaterThan(0);
    expect(marketing.subtotal).toBeGreaterThan(0);
  });

  it("applies enterprise multiplier for large projects", async () => {
    const { generateQuoteAI } = await import("@/lib/ai/generate-quote");
    const result = await generateQuoteAI("enterprise software platform");
    expect(result.subtotal).toBeGreaterThan(100000);
  });

  it("applies small multiplier for basic projects", async () => {
    const { generateQuoteAI } = await import("@/lib/ai/generate-quote");
    const result = await generateQuoteAI("simple website for small business");
    expect(result.subtotal).toBeLessThan(100000);
  });

  it("handles empty description gracefully", async () => {
    const { generateQuoteAI } = await import("@/lib/ai/generate-quote");
    const result = await generateQuoteAI("");
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.subtotal).toBeGreaterThan(0);
  });

  it("handles malformed API response gracefully", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ choices: [{ message: { content: "not json" } }] }),
      ok: true,
    });

    const { generateQuoteAI } = await import("@/lib/ai/generate-quote");
    const result = await generateQuoteAI("consulting project");
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.subtotal).toBeGreaterThan(0);
  });
});
