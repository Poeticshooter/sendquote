import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateQuoteAI } from "@/lib/ai/generate-quote";

// We test detectIndustry() and generateItems() indirectly through generateQuoteAI
// When GROQ_API_KEY is placeholder/undefined, the fallback path is used which
// internally calls detectIndustry() and generateItems().

describe("AI quote generation - fallback path (detectIndustry + generateItems)", () => {
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "placeholder");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects website industry and generates appropriate items", async () => {
    const result = await generateQuoteAI("I need a website for my business");

    // Website template should have 5 items
    expect(result.items).toHaveLength(5);
    expect(result.items[0].description).toContain("Website Design");
    expect(result.notes).toContain("revisions");
    expect(result.terms).toContain("50% advance");
    expect(result.subtotal).toBeGreaterThan(0);
  });

  it("detects consulting industry from description", async () => {
    const result = await generateQuoteAI("Business consulting and advisory services");

    expect(result.items).toHaveLength(4);
    expect(result.items[0].description).toContain("Assessment");
    expect(result.terms).toContain("Monthly invoicing");
  });

  it("detects software industry", async () => {
    const result = await generateQuoteAI("We need a custom software platform built");

    expect(result.items).toHaveLength(6);
    expect(result.items[0].description).toContain("Requirement Analysis");
    expect(result.terms).toContain("30% upon signing");
  });

  it("detects marketing industry", async () => {
    const result = await generateQuoteAI("Social media marketing and SEO services");

    expect(result.items).toHaveLength(4);
    expect(result.items[0].description).toContain("Marketing Strategy");
    expect(result.terms).toContain("Monthly retainer");
  });

  it("detects design industry", async () => {
    const result = await generateQuoteAI("Brand identity design and logo creation");

    expect(result.items).toHaveLength(4);
    expect(result.items[0].description).toContain("Brand Identity");
    expect(result.terms).toContain("50% advance");
  });

  it("defaults to consulting for unknown industries", async () => {
    const result = await generateQuoteAI("Plumbing and HVAC repair services");

    // Fallback should be consulting
    expect(result.items).toHaveLength(4);
    expect(result.items[0].description).toContain("Assessment");
  });

  it("applies enterprise multiplier (1.5x) for enterprise descriptions", async () => {
    const result = await generateQuoteAI("Enterprise website platform");

    // Website items with 1.5x multiplier
    // 15000 -> 22500, 5000 -> 7500, 8000 -> 12000, 5000 -> 7500, 3000 -> 4500
    const websiteHomepage = result.items.find((i) => i.description.includes("Homepage"));
    expect(websiteHomepage).toBeDefined();
    if (websiteHomepage) {
      expect(websiteHomepage.rate).toBe(22500);
      expect(websiteHomepage.rate).toBe(Math.round(15000 * 1.5 / 100) * 100);
    }
  });

  it("applies small multiplier (0.6x) for basic descriptions", async () => {
    const result = await generateQuoteAI("Basic simple website package");

    // Website items with 0.6x multiplier
    // 15000 -> 9000, 5000 -> 3000, etc.
    const websiteHomepage = result.items.find((i) => i.description.includes("Homepage"));
    expect(websiteHomepage).toBeDefined();
    if (websiteHomepage) {
      expect(websiteHomepage.rate).toBe(9000);
      expect(websiteHomepage.rate).toBe(Math.round(15000 * 0.6 / 100) * 100);
    }
  });

  it("applies no multiplier for standard descriptions", async () => {
    const result = await generateQuoteAI("Standard website project");

    const websiteHomepage = result.items.find((i) => i.description.includes("Homepage"));
    expect(websiteHomepage).toBeDefined();
    if (websiteHomepage) {
      expect(websiteHomepage.rate).toBe(15000);
    }
  });

  it("computes subtotal correctly as sum of quantity * rate", async () => {
    const result = await generateQuoteAI("Brand design services");

    const expectedSubtotal = result.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    expect(result.subtotal).toBe(expectedSubtotal);
  });

  it("generates fallback notes and terms when no template matches", async () => {
    // This will match consulting (default) which always has notes/terms
    const result = await generateQuoteAI("Some random unknown service");
    expect(result.notes).toBeTruthy();
    expect(result.terms).toBeTruthy();
  });
});

describe("AI quote generation - AI path with mocked fetch", () => {
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "gsk_test_real_key_12345");
    vi.stubEnv("GROQ_MODEL", "mixtral-8x7b-32768");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses valid AI response from Groq API", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: `{
  "items": [
    { "description": "Website Development", "quantity": 1, "rate": 50000 },
    { "description": "UI/UX Design", "quantity": 1, "rate": 30000 }
  ],
  "notes": "Includes 2 rounds of revisions.",
  "terms": "50% advance, 50% on completion."
}`,
          },
        },
      ],
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockResponse),
    }));

    const result = await generateQuoteAI("Custom website project");

    expect(result.items).toHaveLength(2);
    expect(result.items[0].description).toBe("Website Development");
    expect(result.items[0].rate).toBe(50000);
    expect(result.subtotal).toBe(50000 + 30000);
    expect(result.notes).toContain("revisions");
    expect(result.terms).toContain("50% advance");
  });

  it("falls back to template when AI response cannot be parsed", async () => {
    // Mock fetch returning invalid JSON response
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ choices: [{ message: { content: "Sorry, I cannot help with that." } }] }),
    }));

    const result = await generateQuoteAI("Website design project");

    // Should fall back to template-based generation
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.subtotal).toBeGreaterThan(0);
  });

  it("falls back to template when fetch throws an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const result = await generateQuoteAI("Website project");

    // Should fall back to template
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.subtotal).toBeGreaterThan(0);
  });

  it("makes fetch call with correct Groq API endpoint and headers", async () => {
    const mockJson = vi.fn().mockResolvedValue({
      choices: [{ message: { content: '{"items":[{"description":"Test","quantity":1,"rate":100}],"notes":"","terms":""}' } }],
    });

    const mockFetch = vi.fn().mockResolvedValue({ json: mockJson });
    vi.stubGlobal("fetch", mockFetch);

    await generateQuoteAI("API integration project");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(options.method).toBe("POST");
    expect(options.headers["Authorization"]).toBe("Bearer gsk_test_real_key_12345");
    expect(options.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body.model).toBe("mixtral-8x7b-32768");
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe("user");
    expect(body.temperature).toBe(0.2);
  });
});
