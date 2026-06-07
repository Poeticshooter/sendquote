import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") || "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret || webhookSecret === "your-stripe-webhook-secret") {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
    }

    let event;
    try {
      const { Stripe } = await import("stripe");
      const stripe = new Stripe(webhookSecret, { apiVersion: "2025-02-24-acacia" as any });
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`Payment succeeded: ${paymentIntent.id}`);
        break;
      }
      case "payment_intent.payment_failed": {
        const failedIntent = event.data.object;
        console.log(`Payment failed: ${failedIntent.id}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
