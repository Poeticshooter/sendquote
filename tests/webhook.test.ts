import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    rpc: vi.fn().mockResolvedValue({ data: { status: "processed", paid_amount: 5000 }, error: null }),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "inv-1", balance_due: 5000 }, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }),
  })),
}));

describe("Webhook Payment Processing", () => {
  beforeEach(() => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "test-secret");
  });

  it("rejects request with missing webhook secret", async () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "");
    const { POST } = await import("@/app/api/webhook/razorpay/route");
    const request = new Request("https://sendquote.in/api/webhook/razorpay", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Webhook not configured");
  });

  it("rejects request with invalid signature", async () => {
    const { POST } = await import("@/app/api/webhook/razorpay/route");
    const request = new Request("https://sendquote.in/api/webhook/razorpay", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": "invalid",
      },
      body: JSON.stringify({ event: "payment.captured" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("processes valid payment.captured webhook", async () => {
    const { POST } = await import("@/app/api/webhook/razorpay/route");
    const payload = {
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_test_123",
            order_id: "order_test_123",
            amount: 500000,
            notes: { quote_id: "550e8400-e29b-41d4-a716-446655440000" },
          },
        },
      },
    };

    const body = JSON.stringify(payload);
    const crypto = await import("node:crypto");
    const expectedSignature = crypto
      .createHmac("sha256", "test-secret")
      .update(body)
      .digest("hex");

    const request = new Request("https://sendquote.in/api/webhook/razorpay", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": expectedSignature,
      },
      body,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.result.status).toBe("processed");
  });

  it("handles subscription.charged webhook", async () => {
    const { POST } = await import("@/app/api/webhook/razorpay/route");
    const payload = {
      event: "subscription.charged",
      payload: {
        subscription: {
          entity: {
            id: "sub_test_123",
            current_start: Math.floor(Date.now() / 1000),
            current_end: Math.floor(Date.now() / 1000) + 2592000,
          },
        },
      },
    };

    const body = JSON.stringify(payload);
    const crypto = await import("node:crypto");
    const expectedSignature = crypto
      .createHmac("sha256", "test-secret")
      .update(body)
      .digest("hex");

    const request = new Request("https://sendquote.in/api/webhook/razorpay", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": expectedSignature,
      },
      body,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
