import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const { amount, currency } = await request.json();

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "placeholder") {
      return NextResponse.json({
        success: true,
        mock: true,
        clientSecret: "pi_mock_secret_" + Date.now(),
        publishableKey: "pk_test_placeholder",
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency || "usd",
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
