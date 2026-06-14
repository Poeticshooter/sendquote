import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { verifyCronSecret } from "@/lib/security/cron";

export const dynamic = "force-dynamic";

const REMINDER_DAYS = [3, 7, 14, 30] as const;

function getReminderType(daysOverdue: number): string {
  return `overdue_${daysOverdue}d`;
}

function getReminderSubject(daysOverdue: number, invoiceNumber: string, clientName: string, amount: string): string {
  if (daysOverdue === 3) return `⏰ Friendly reminder: ${invoiceNumber} from ${clientName} — ${amount}`;
  if (daysOverdue === 7) return `📋 Invoice ${invoiceNumber} is 1 week overdue — ${amount}`;
  if (daysOverdue === 14) return `🔴 Invoice ${invoiceNumber} is 2 weeks overdue — ${amount}`;
  return `⚠️ Final reminder: Invoice ${invoiceNumber} — ${amount} overdue`;
}

function buildReminderHtml(daysOverdue: number, invoiceNumber: string, clientName: string, amount: string, invoiceLink: string): string {
  const urgencyColor = daysOverdue >= 14 ? "#DC2626" : daysOverdue >= 7 ? "#D97706" : "#6B7280";
  const urgencyLabel = daysOverdue >= 14 ? "Overdue — Action Required" : daysOverdue >= 7 ? "Overdue" : "Payment Due";

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px;">
      <div style="background:linear-gradient(135deg,#141414,#1A1A1A);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">
        <div style="margin-bottom:24px;">
          <span style="color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:-0.5px;">SendQuote</span>
        </div>
        <h2 style="color:#FFFFFF;font-size:18px;font-weight:700;margin:0 0 4px 0;">
          Invoice ${urgencyLabel}
        </h2>
        <p style="color:#A0A0A0;font-size:14px;margin:0 0 24px 0;">${clientName} · ${invoiceNumber}</p>
        <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#707070;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 4px 0;">Outstanding Amount</p>
          <p style="color:#FFFFFF;font-size:28px;font-weight:700;margin:0;letter-spacing:-0.02em;">${amount}</p>
          <p style="color:${urgencyColor};font-size:12px;margin:8px 0 0 0;">
            ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue
          </p>
        </div>
        <a href="${invoiceLink}"
           style="display:inline-block;padding:14px 36px;background:#00D4AA;color:#0A0A0A;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">
          Send Payment Reminder →
        </a>
        <p style="color:#707070;font-size:12px;margin-top:20px;line-height:1.6;">
          You can also mark this invoice as paid if payment was received offline.<br/>
          <a href="${invoiceLink}" style="color:#00D4AA;text-decoration:none;">View invoice details →</a>
        </p>
      </div>
    </div>
  `.trim();
}

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();

    // Find all invoices that are overdue with outstanding balance
    const { data: overdueInvoices, error } = await supabase
      .from("invoices")
      .select(`
        id, invoice_number, client_name, due_date,
        balance_due, user_id
      `)
      .in("status", ["pending", "overdue"])
      .lt("due_date", now.toISOString())
      .gt("balance_due", 0);

    if (error) {
      Sentry.captureException(error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!overdueInvoices?.length) {
      return NextResponse.json({ processed: 0, message: "No overdue invoices" });
    }

    let sent = 0;
    const errors: string[] = [];

    for (const invoice of overdueInvoices) {
      const daysOverdue = Math.floor((now.getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));

      if (!(REMINDER_DAYS as readonly number[]).includes(daysOverdue)) continue;

      const reminderType = getReminderType(daysOverdue);

      // Check for duplicate — only send once per type per invoice
      const { count } = await supabase
        .from("cron_reminders")
        .select("*", { count: "exact", head: true })
        .eq("invoice_id", invoice.id)
        .eq("reminder_type", reminderType);

      if (count && count > 0) continue;

      // Get user email for notification
      const { data: userData } = await supabase.auth.admin.getUserById(invoice.user_id);
      const userEmail = userData?.user?.email;
      if (!userEmail) continue;

      const amountFormatted = `₹${Number(invoice.balance_due).toLocaleString("en-IN")}`;
      const invoiceLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/invoices/${invoice.id}`;
      const subject = getReminderSubject(daysOverdue, invoice.invoice_number, invoice.client_name, amountFormatted);
      const html = buildReminderHtml(daysOverdue, invoice.invoice_number, invoice.client_name, amountFormatted, invoiceLink);

      const result = await sendEmail({ to: [userEmail], subject, html });

      if (result.success) {
        await supabase.from("cron_reminders").insert({
          invoice_id: invoice.id,
          reminder_type: reminderType,
          sent_at: now.toISOString(),
          sent_to_email: userEmail,
        });
        sent++;
      } else {
        errors.push(`Failed for invoice ${invoice.invoice_number}: ${result.reason}`);
      }
    }

    return NextResponse.json({
      processed: sent,
      total_overdue: overdueInvoices.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e) {
    console.error("Reminder processing error:", e);
    Sentry.captureException(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
