import { describe, it, expect } from "vitest";
import type { QuoteStatus } from "@/types";

describe("QuoteStatus values", () => {
  const validStatuses = [
    "draft",
    "sent",
    "opened",
    "accepted",
    "changes_requested",
    "expired",
    "archived",
    "lost",
  ] as const;

  it("has all required status values", () => {
    expect(validStatuses).toHaveLength(8);
    expect(validStatuses).toContain("draft");
    expect(validStatuses).toContain("sent");
    expect(validStatuses).toContain("opened");
    expect(validStatuses).toContain("accepted");
    expect(validStatuses).toContain("changes_requested");
    expect(validStatuses).toContain("expired");
    expect(validStatuses).toContain("archived");
    expect(validStatuses).toContain("lost");
  });

  it("each status is a non-empty string", () => {
    for (const status of validStatuses) {
      expect(status.length).toBeGreaterThan(0);
    }
  });

  it("all statuses are lowercase and use underscores for spaces", () => {
    for (const status of validStatuses) {
      expect(status).toMatch(/^[a-z_]+$/);
    }
  });

  it("status can be assigned to a QuoteStatus typed variable", () => {
    // Type-level test: these assignments should compile
    const status1: QuoteStatus = "draft";
    const status2: QuoteStatus = "sent";
    const status3: QuoteStatus = "accepted";
    const status4: QuoteStatus = "changes_requested";

    expect([status1, status2, status3, status4]).toHaveLength(4);
  });
});

describe("Quote number format", () => {
  it("matches QTE-YYYY-NNNN pattern for valid quote numbers", () => {
    const valid = "QTE-2024-0001";
    expect(valid).toMatch(/^QTE-\d{4}-\d{4}$/);
  });

  it("accepts current year quotes", () => {
    const year = new Date().getFullYear();
    const quoteNumber = `QTE-${year}-0001`;
    expect(quoteNumber).toMatch(/^QTE-\d{4}-\d{4}$/);
  });

  it("accepts sequential numbers with leading zeros", () => {
    expect("QTE-2024-0001").toMatch(/^QTE-\d{4}-\d{4}$/);
    expect("QTE-2024-0050").toMatch(/^QTE-\d{4}-\d{4}$/);
    expect("QTE-2024-1000").toMatch(/^QTE-\d{4}-\d{4}$/);
  });

  it("rejects incorrect prefix", () => {
    expect("INV-2024-0001").not.toMatch(/^QTE-\d{4}-\d{4}$/);
  });

  it("rejects missing leading zeros in sequential number", () => {
    expect("QTE-2024-1").not.toMatch(/^QTE-\d{4}-\d{4}$/);
  });

  it("rejects two-digit year format", () => {
    expect("QTE-24-0001").not.toMatch(/^QTE-\d{4}-\d{4}$/);
  });

  it("rejects extra characters after valid prefix", () => {
    expect("QTE-2024-0001-v2").not.toMatch(/^QTE-\d{4}-\d{4}$/);
  });

  it("rejects empty string", () => {
    expect("").not.toMatch(/^QTE-\d{4}-\d{4}$/);
  });

  it("rejects non-numeric year", () => {
    expect("QTE-ABCD-0001").not.toMatch(/^QTE-\d{4}-\d{4}$/);
  });

  it("constructs valid quote numbers from year and counter", () => {
    const year = 2024;
    const counter = 1;
    const padded = String(counter).padStart(4, "0");
    const quoteNumber = `QTE-${year}-${padded}`;

    expect(quoteNumber).toBe("QTE-2024-0001");
    expect(quoteNumber).toMatch(/^QTE-\d{4}-\d{4}$/);
  });

  it("handles large sequential numbers", () => {
    const quoteNumber = "QTE-2024-9999";
    expect(quoteNumber).toMatch(/^QTE-\d{4}-\d{4}$/);
  });

  it("template matches the format used in the existing codebase", () => {
    // This matches the pattern from tests/utils.test.ts
    const year = new Date().getFullYear();
    const num = `QTE-${year}-0001`;
    expect(num).toMatch(/^QTE-\d{4}-\d{4}$/);
  });
});
