import { describe, it, expect } from "vitest";
import type { ContractData } from "@/lib/contracts/generate";
import { generateContractHtml } from "@/lib/contracts/generate";

function makeContractData(overrides: Partial<ContractData> = {}): ContractData {
  return {
    quoteNumber: "QTE-2026-0001",
    clientName: "Acme Corp",
    clientEmail: "client@acme.com",
    businessName: "SendQuote",
    items: [
      { description: "Website Design", quantity: 1, rate: 50000, amount: 50000 },
    ],
    subtotal: 50000,
    gstRate: 18,
    gstAmount: 9000,
    total: 59000,
    notes: "Standard terms apply",
    terms: "Net 30 payment",
    signatoryName: "John Doe",
    signedAt: "2026-06-07T12:00:00Z",
    validUntil: "2026-07-07",
    ...overrides,
  };
}

describe("generateContractHtml", () => {
  it("generates valid HTML with quote number", () => {
    const html = generateContractHtml(makeContractData());
    expect(html).toContain("QTE-2026-0001");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("includes client name", () => {
    const html = generateContractHtml(makeContractData({ clientName: "Test Client" }));
    expect(html).toContain("Test Client");
  });

  it("includes business name", () => {
    const html = generateContractHtml(makeContractData({ businessName: "My Business" }));
    expect(html).toContain("My Business");
  });

  it("includes items in table", () => {
    const html = generateContractHtml(makeContractData({
      items: [{ description: "Custom Item", quantity: 2, rate: 1000, amount: 2000 }],
    }));
    expect(html).toContain("Custom Item");
    expect(html).toContain("2");
    expect(html).toContain("₹1,000");
    expect(html).toContain("₹2,000");
  });

  it("escapes HTML in client name (XSS prevention)", () => {
    const html = generateContractHtml(makeContractData({
      clientName: "<script>alert('xss')</script>",
    }));
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("escapes HTML in notes (XSS prevention)", () => {
    const html = generateContractHtml(makeContractData({
      notes: "<img src=x onerror=alert(1)>",
    }));
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img src=x");
  });

  it("escapes HTML in terms (XSS prevention)", () => {
    const html = generateContractHtml(makeContractData({
      terms: "<script>stealCookies()</script>",
    }));
    expect(html).toContain("&lt;script&gt;stealCookies");
    expect(html).not.toContain("<script>");
  });

  it("escapes HTML in business name", () => {
    const html = generateContractHtml(makeContractData({
      businessName: "Business & Co <test>",
    }));
    expect(html).toContain("Business &amp; Co &lt;test&gt;");
  });

  it("shows GST section when rate > 0", () => {
    const html = generateContractHtml(makeContractData({ gstRate: 18 }));
    expect(html).toContain("GST (18%)");
  });

  it("hides GST section when rate is 0", () => {
    const html = generateContractHtml(makeContractData({ gstRate: 0, gstAmount: 0 }));
    expect(html).not.toContain("GST (0%)");
  });

  it("includes notes section when notes exist", () => {
    const html = generateContractHtml(makeContractData({ notes: "Extra notes" }));
    expect(html).toContain("Extra notes");
  });

  it("omits notes section when notes are null", () => {
    const html = generateContractHtml(makeContractData({ notes: null }));
    expect(html).not.toContain("Extra notes");
  });

  it("includes valid until date", () => {
    const html = generateContractHtml(makeContractData({ validUntil: "2026-08-01" }));
    expect(html).toContain("2026");
  });

  it("includes client email when present", () => {
    const html = generateContractHtml(makeContractData({ clientEmail: "test@example.com" }));
    expect(html).toContain("test@example.com");
  });

  it("omits client email when null", () => {
    const html = generateContractHtml(makeContractData({ clientEmail: null }));
    expect(html).not.toContain("test@example.com");
  });
});
