import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  try {
    const contentLength = parseInt(request.headers.get("content-length") || "0");
    if (contentLength > 1_000_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      Sentry.captureMessage("RAZORPAY_WEBHOOK_SECRET is not configured", "fatal");
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

    // Deterministic eventId from event body for idempotency (avoids Math.random() duplicates)
    const deterministicId = crypto.createHash("sha256").update(body).digest("hex").slice(0, 16);
    const eventId = event.event === "payment.captured"
      ? event.payload.payment.entity.id
      : `${event.event}_${event.payload?.payment?.entity?.order_id || event.payload?.subscription?.entity?.id || deterministicId}`;

    // For payment.captured: delegate to atomic RPC
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const paymentAmount = payment.amount / 100;
      const orderNotes = event.payload.payment.entity.notes || {};
      const quoteId = orderNotes.quote_id;

      // Verify amount against invoice BEFORE calling RPC
      let invoiceId: string | null = null;
      if (quoteId) {
        const { data: invoice } = await supabase
          .from("invoices")
          .select("id, balance_due")
          .eq("quote_id", quoteId)
          .maybeSingle();

        if (invoice) {
          if (Math.abs(paymentAmount - Number(invoice.balance_due)) > 1) {
            // Amount mismatch — log as failure, don't process
            await supabase.rpc("process_razorpay_payment", {
              p_razorpay_event_id: eventId,
              p_event_type: "payment.failed",
              p_quote_id: quoteId,
              p_payment_amount: paymentAmount,
              p_razorpay_payment_id: payment.id,
              p_razorpay_order_id: payment.order_id,
              p_full_event: event,
            });
            Sentry.captureMessage(
              `Payment amount mismatch: received ${paymentAmount}, expected ${invoice.balance_due}`,
              "warning"
            );
            return NextResponse.json({ error: "amount_mismatch" }, { status: 400 });
          }
          invoiceId = invoice.id;
        }
      }

      // Atomic payment processing via RPC
      const orderId = payment.order_id;
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("razorpay_subscription_id")
        .eq("razorpay_order_id", orderId)
        .maybeSingle();

      const { data: rpcResult, error: rpcError } = await supabase.rpc("process_razorpay_payment", {
        p_razorpay_event_id: eventId,
        p_event_type: "payment.captured",
        p_quote_id: quoteId || null,
        p_payment_amount: paymentAmount,
        p_razorpay_payment_id: payment.id,
        p_razorpay_order_id: orderId,
        p_invoice_id: invoiceId,
        p_subscription_id: subscriptions?.razorpay_subscription_id || null,
        p_full_event: event,
      });

      if (rpcError) {
        Sentry.captureException(rpcError);
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
      }

      // Alert on overpayment
      if (rpcResult?.paid_amount && rpcResult?.invoice_status === "paid") {
        // paid_amount can be checked against original invoice amount for overpayment alerts
      }

      return NextResponse.json({ success: true, result: rpcResult });
    }

    // For subscription.charged: validate amount then delegate to RPC
    if (event.event === "subscription.charged") {
      const sub = event.payload.subscription?.entity;
      const payment = event.payload.payment?.entity;
      const subscriptionId = sub?.id;
      const paymentAmount = payment ? payment.amount / 100 : 0;

      if (subscriptionId) {
        // Verify charged amount matches expected
        const { data: expectedSub } = await supabase
          .from("subscriptions")
          .select("total_amount")
          .eq("razorpay_subscription_id", subscriptionId)
          .maybeSingle();

        if (expectedSub?.total_amount && paymentAmount > 0) {
          const expected = Number(expectedSub.total_amount);
          if (paymentAmount < expected - 1) {
            Sentry.captureMessage(
              `Subscription charge underpayment: received ${paymentAmount}, expected ${expected}`,
              "warning"
            );
            return NextResponse.json({ error: "amount_mismatch" }, { status: 400 });
          }
        }

        const { data: rpcResult, error: rpcError } = await supabase.rpc("process_razorpay_payment", {
          p_razorpay_event_id: eventId,
          p_event_type: "subscription.charged",
          p_quote_id: null,
          p_payment_amount: paymentAmount,
          p_razorpay_payment_id: payment?.id || "",
          p_razorpay_order_id: payment?.order_id || "",
          p_invoice_id: null,
          p_subscription_id: subscriptionId,
          p_full_event: event,
        });

        if (rpcError) {
          Sentry.captureException(rpcError);
          return NextResponse.json({ error: "Processing failed" }, { status: 500 });
        }

        return NextResponse.json({ success: true, result: rpcResult });
      }
    }

    // For payment.failed: dedup check, log event + notify user
    if (event.event === "payment.failed") {
      // Check if this failure was already processed (idempotency check)
      const { data: existingFail } = await supabase
        .from("webhook_events")
        .select("id")
        .eq("razorpay_event_id", eventId)
        .maybeSingle();

      if (existingFail) {
        return NextResponse.json({ success: true, note: "duplicate" });
      }

      await supabase.from("webhook_events").insert({
        razorpay_event_id: eventId,
        event_type: "payment.failed",
        payload: event,
        outcome: "failed",
      });

      // Fire-and-forget dunning email (non-blocking)
      if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "placeholder") {
        const orderId = event.payload?.payment?.entity?.order_id;
        const errorCode = event.payload?.payment?.entity?.error_code || "";
        const errorDesc = event.payload?.payment?.entity?.error_description || "Payment failed";

        // Find the user who owns this order
        if (orderId) {
          const { data: subs } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("razorpay_order_id", orderId)
            .maybeSingle();

          if (subs?.user_id) {
            const { data: userData } = await supabase.auth.admin.getUserById(subs.user_id);
            const userEmail = userData?.user?.email;

            if (userEmail) {
              const { sendEmail } = await import("@/lib/email/send");
              const subject = "Payment failed — action needed";
              const html = `
                <h1>Payment Failed</h1>
                <p>Your recent payment could not be processed.</p>
                <p><strong>Reason:</strong> ${errorDesc}${errorCode ? ` (${errorCode})` : ""}</p>
                <p>Please check your payment method and try again.</p>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/settings" style="display:inline-block;padding:12px 24px;background:#14b8a6;color:white;text-decoration:none;border-radius:6px;">Update Payment Method</a></p>
              `.trim();
              sendEmail({ to: [userEmail], subject, html }).catch((e) => {
                Sentry.captureException(e, { extra: { context: "payment.failed dunning email", userId: subs.user_id } });
              });
            }
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    // All other events: log and ignore
    await supabase.from("webhook_events").insert({
      razorpay_event_id: eventId,
      event_type: event.event || "unknown",
      payload: event,
      outcome: "ignored",
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
