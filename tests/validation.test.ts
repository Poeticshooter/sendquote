import { describe, it, expect } from "vitest";
import {
  CreateQuoteSchema,
  AcceptQuoteSchema,
  AIGenerateSchema,
  PortalSchema,
  SendQuoteSchema,
} from "@/lib/api-validation";

describe("CreateQuoteSchema", () => {
  const validQuote = {
    client_name: "Acme Corp",
    items: [
      { description: "Website Design", quantity: 1, rate: 50000 },
    ],
  };

  it("passes for valid quote data", () => {
    const result = CreateQuoteSchema.safeParse(validQuote);
    expect(result.success).toBe(true);
  });

  it("rejects empty client name", () => {
    const result = CreateQuoteSchema.safeParse({ ...validQuote, client_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty items array", () => {
    const result = CreateQuoteSchema.safeParse({ ...validQuote, items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects items with negative quantity", () => {
    const result = CreateQuoteSchema.safeParse({
      ...validQuote,
      items: [{ description: "Test", quantity: -1, rate: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects items with negative rate", () => {
    const result = CreateQuoteSchema.safeParse({
      ...validQuote,
      items: [{ description: "Test", quantity: 1, rate: -100 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = CreateQuoteSchema.safeParse({
      ...validQuote,
      client_email: "client@acme.com",
      client_phone: "+91-9876543210",
      gst_rate: 18,
      notes: "Test notes",
      terms: "Net 30",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = CreateQuoteSchema.safeParse({
      ...validQuote,
      client_email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects gst_rate over 100", () => {
    const result = CreateQuoteSchema.safeParse({
      ...validQuote,
      gst_rate: 150,
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many items", () => {
    const items = Array.from({ length: 501 }, (_, i) => ({
      description: `Item ${i}`,
      quantity: 1,
      rate: 100,
    }));
    const result = CreateQuoteSchema.safeParse({ ...validQuote, items });
    expect(result.success).toBe(false);
  });
});

describe("AcceptQuoteSchema", () => {
  it("passes with valid data", () => {
    const result = AcceptQuoteSchema.safeParse({
      public_token: "abc-123",
      signature_data: "data:image/png;base64,...",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing public_token", () => {
    const result = AcceptQuoteSchema.safeParse({
      signature_data: "data:image/png;base64,...",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty signature", () => {
    const result = AcceptQuoteSchema.safeParse({
      public_token: "abc-123",
      signature_data: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("AIGenerateSchema", () => {
  it("passes with valid description", () => {
    const result = AIGenerateSchema.safeParse({ description: "Website design for a dental clinic" });
    expect(result.success).toBe(true);
  });

  it("rejects too short description", () => {
    const result = AIGenerateSchema.safeParse({ description: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = AIGenerateSchema.safeParse({ description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects description that is only whitespace", () => {
    const result = AIGenerateSchema.safeParse({ description: "   " });
    expect(result.success).toBe(false);
  });
});

describe("PortalSchema", () => {
  it("passes with valid email", () => {
    const result = PortalSchema.safeParse({ email: "client@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = PortalSchema.safeParse({ email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = PortalSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});

describe("SendQuoteSchema", () => {
  it("passes with valid quote_id", () => {
    const result = SendQuoteSchema.safeParse({
      quote_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-uuid quote_id", () => {
    const result = SendQuoteSchema.safeParse({ quote_id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing quote_id", () => {
    const result = SendQuoteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
