import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { wrapEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization") || "";
  const expectedToken = process.env.CRON_SECRET;
  if (!expectedToken) {
    console.error("CRON_SECRET not configured");
    return false;
  }
  const expected = `Bearer ${expectedToken}`;
  if (authHeader.length !== expected.length) return false;
  try {
    const { timingSafeEqual } = require("crypto");
    return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  } catch {
    return authHeader === expected;
  }
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    let processed = 0;

    // Get pending follow-ups that are due
    const { data: pending } = await admin
      .from("followup_schedule")
      .select("id, quote_id, sequence_id, step, scheduled_at")
      .eq("status", "pending")
      .lte("scheduled_at", now)
      .limit(50);

    if (!pending?.length) {
      return NextResponse.json({ processed: 0, message: "No pending follow-ups" });
    }

    for (const item of pending) {
      const { data: quote } = await admin
        .from("quotes")
        .select("id, quote_number, client_name, client_email, total, user_id, public_token")
        .eq("id", item.quote_id)
        .single();

      if (!quote || !quote.client_email) {
        await admin.from("followup_schedule").update({ status: "cancelled" }).eq("id", item.id);
        continue;
      }

      const { data: profile } = await admin
        .from("profiles")
        .select("business_name")
        .eq("user_id", quote.user_id)
        .single();

      const { data: sequence } = await admin
        .from("followup_sequences")
        .select("subject_template, body_template")
        .eq("id", item.sequence_id)
        .single();

      if (!sequence) {
        await admin.from("followup_schedule").update({ status: "cancelled" }).eq("id", item.id);
        continue;
      }

      const subject = sequence.subject_template
        .replace("{{quote_number}}", quote.quote_number)
        .replace("{{client_name}}", quote.client_name)
        .replace("{{total}}", `₹${Number(quote.total).toLocaleString("en-IN")}`);

      const body = sequence.body_template
        .replace("{{quote_number}}", quote.quote_number)
        .replace("{{client_name}}", quote.client_name)
        .replace("{{total}}", `₹${Number(quote.total).toLocaleString("en-IN")}`)
        .replace("{{business_name}}", profile?.business_name || "SendQuote");

      const result = await sendEmail({
        to: [quote.client_email],
        subject,
        html: wrapEmail(`
          <h1 style="color:#F5F5F5;font-size:24px;font-weight:700;margin:0 0 8px 0;">${subject}</h1>
          <p style="color:#808080;font-size:15px;line-height:1.6;white-space:pre-line;margin:0 0 24px 0;">${body}</p>
          <div style="text-align:center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/q/${quote.public_token}"
               style="display:inline-block;padding:14px 32px;background:#00D4AA;color:#0A0A0A;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">
              View Quote
            </a>
          </div>
        `),
      });

      if (result.success) {
        await admin.from("followup_schedule").update({
          status: "sent",
          sent_at: now,
        }).eq("id", item.id);
        processed++;
      }
    }

    return NextResponse.json({ processed, total: pending.length });
  } catch (e) {
    console.error("Follow-up process error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
