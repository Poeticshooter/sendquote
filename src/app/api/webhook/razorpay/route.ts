import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature.length !== expectedSignature.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const supabase = createAdminClient();

    const eventId = event.event === "payment.captured"
      ? event.payload.payment.entity.id
      : `${event.event}_${event.payload?.payment?.entity?.order_id || Date.now()}`;

    const { data: existing } = await supabase
      .from("webhook_events")
      .select("id")
      .eq("razorpay_event_id", eventId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        const paymentAmount = payment.amount / 100; // paise to rupees
        const orderNotes = event.payload.payment.entity.notes || {};

        // Verify amount against quote via order notes
        const quoteId = orderNotes.quote_id;
        if (quoteId) {
          const { data: invoice } = await supabase
            .from("invoices")
            .select("id, amount, paid_amount, balance_due")
            .eq("quote_id", quoteId)
            .single();

          if (invoice) {
            if (Math.abs(paymentAmount - Number(invoice.balance_due)) > 1) {
              Sentry.captureMessage(`Payment amount mismatch: received ${paymentAmount}, expected ${invoice.balance_due}`, "warning");
            }
            const newPaid = (invoice.paid_amount || 0) + paymentAmount;
            const newStatus = newPaid >= Number(invoice.amount) ? "paid" : "pending";
            await supabase
              .from("invoices")
              .update({
                paid_amount: newPaid,
                balance_due: Math.max(0, Number(invoice.amount) - newPaid),
                status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", invoice.id);
          }
        }

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
          razorpay_event_id: eventId,
          event_type: event.event,
          payload: event,
          outcome: "processed",
        });

        break;
      }

      case "payment.failed": {
        await supabase.from("webhook_events").insert({
          razorpay_event_id: eventId,
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
          razorpay_event_id: eventId,
          event_type: event.event,
          payload: event,
          outcome: "ignored",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
