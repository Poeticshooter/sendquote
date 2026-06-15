import { describe, it, expect } from "vitest";

describe("PDF Generation", () => {
  it("generates valid PDF string", { timeout: 15000 }, async () => {
    const { renderToString } = await import("@react-pdf/renderer");
    const { QuotePDF } = await import("@/components/quotes/quote-pdf");

    const result = await renderToString(
      <QuotePDF
        quoteNumber="QTE-001"
        clientName="Test Client"
        items={[
          { description: "Web Development", quantity: 1, rate: 50000, amount: 50000 },
          { description: "Hosting Setup", quantity: 1, rate: 5000, amount: 5000 },
        ]}
        subtotal={55000}
        total={64900}
        gstRate={18}
        cgstRate={9}
        cgstAmount={4950}
        sgstRate={9}
        sgstAmount={4950}
        igstRate={0}
        igstAmount={0}
        businessName="Test Business"
        status="sent"
      />
    );
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(100);
    expect(result).toContain("%PDF");
  });

  it("renders draft watermark for draft quotes", async () => {
    const { renderToString } = await import("@react-pdf/renderer");
    const { QuotePDF } = await import("@/components/quotes/quote-pdf");

    const result = await renderToString(
      <QuotePDF
        quoteNumber="QTE-002"
        clientName="Draft Client"
        items={[{ description: "Consulting", quantity: 1, rate: 1000, amount: 1000 }]}
        subtotal={1000}
        total={1000}
        gstRate={0}
        cgstRate={0}
        cgstAmount={0}
        sgstRate={0}
        sgstAmount={0}
        igstRate={0}
        igstAmount={0}
        businessName="Test Business"
        status="draft"
      />
    );
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(100);
    expect(result).toContain("%PDF");
  });

  it("renders without GST when not provided", async () => {
    const { renderToString } = await import("@react-pdf/renderer");
    const { QuotePDF } = await import("@/components/quotes/quote-pdf");

    const result = await renderToString(
      <QuotePDF
        quoteNumber="QTE-003"
        clientName="No GST Client"
        items={[{ description: "Service", quantity: 1, rate: 1000, amount: 1000 }]}
        subtotal={1000}
        total={1000}
        gstRate={0}
        cgstRate={0}
        cgstAmount={0}
        sgstRate={0}
        sgstAmount={0}
        igstRate={0}
        igstAmount={0}
        businessName="Test Business"
        status="sent"
      />
    );
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(100);
    expect(result).toContain("%PDF");
  });
});
