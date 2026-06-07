import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { amount, currency } = await request.json();
    const keySecret = process.env.STRIPE_SECRET_KEY;

    if (!keySecret || keySecret === "your-stripe-secret") {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
    }

    const auth = Buffer.from(`${keySecret}:`).toString("base64");

    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: String(Math.round(amount * 100)),
        currency: (currency || "usd").toLowerCase(),
        automatic_payment_methods: JSON.stringify({ enabled: true }),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || "Stripe error" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      clientSecret: data.client_secret,
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
