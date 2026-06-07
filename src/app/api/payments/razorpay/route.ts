import { NextRequest, NextResponse } from "next/server";
import { RazorpayPaymentSchema } from "@/lib/api-validation";
import { parseError, requireAuth } from "@/lib/api-helper";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { amount, currency } = RazorpayPaymentSchema.parse(body);

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
        amount: Math.round(amount * 100),
        currency: currency || "INR",
        receipt: `rcpt_${Date.now()}`,
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
