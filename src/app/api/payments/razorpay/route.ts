import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseError, requireAuth } from "@/lib/api-helper";
import { z } from "zod";

const PaymentRequestSchema = z.object({
  quote_id: z.string().uuid("Invalid quote ID"),
  currency: z.string().max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { quote_id, currency } = PaymentRequestSchema.parse(body);

    const supabase = await createClient();
    const { data: quote } = await supabase
      .from("quotes")
      .select("total, user_id, quote_number, status")
      .eq("id", quote_id)
      .single();

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    if (quote.user_id !== user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    if (quote.status !== "accepted") return NextResponse.json({ error: "Quote must be accepted before payment" }, { status: 409 });

    const verifiedAmount = Math.round(Number(quote.total) * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: verifiedAmount,
        currency: currency || "INR",
        receipt: `${quote.quote_number}_${Date.now()}`,
        notes: { quote_id, user_id: user.id },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.description || "Razorpay error" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      key: keyId,
    });
  } catch (e) {
    return parseError(e);
  }
}
