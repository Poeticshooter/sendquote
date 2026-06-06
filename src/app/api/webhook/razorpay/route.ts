import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const supabase = createAdminClient();

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;

        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("id, user_id")
          .eq("razorpay_order_id", orderId);

        if (subscriptions && subscriptions.length > 0) {
          await supabase
            .from("subscriptions")
            .update({
              razorpay_payment_id: payment.id,
              status: "active",
              last_payment_attempt: new Date().toISOString(),
            })
            .eq("razorpay_order_id", orderId);
        }

        await supabase.from("webhook_events").insert({
          razorpay_event_id: payment.id || event.event,
          event_type: event.event,
          payload: event,
          outcome: "processed",
        });

        break;
      }

      case "payment.failed": {
        await supabase.from("webhook_events").insert({
          razorpay_event_id: event.event,
          event_type: event.event,
          payload: event,
          outcome: "failed",
        });
        break;
      }

      case "subscription.charged": {
        const sub = event.payload.subscription?.entity;
        if (sub) {
          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              current_period_start: new Date(sub.current_start * 1000).toISOString(),
              current_period_end: new Date(sub.current_end * 1000).toISOString(),
              last_payment_attempt: new Date().toISOString(),
            })
            .eq("razorpay_subscription_id", sub.id);
        }
        break;
      }

      default: {
        await supabase.from("webhook_events").insert({
          razorpay_event_id: event.event,
          event_type: event.event,
          payload: event,
          outcome: "ignored",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
