import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as Sentry from "@sentry/nextjs";
import { verifyCronSecret } from "@/lib/security/cron";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const results: string[] = [];

    // Find invoices marked as 'paid' but with no corresponding payment record
    const { data: unpaidInvoices } = await supabase
      .from("invoices")
      .select("id, invoice_number, amount, paid_amount, status, created_at")
      .eq("status", "paid")
      .is("paid_amount", null);

    if (unpaidInvoices && unpaidInvoices.length > 0) {
      for (const inv of unpaidInvoices) {
        results.push(`INVOICE-MISMATCH: ${inv.invoice_number} - marked paid but paid_amount is null`);
      }
    }

    // Find payments created but invoices not updated (webhook miss detection)
    const { data: recentPayments, error: payError } = await supabase
      .from("payments")
      .select("invoice_id, amount, created_at")
      .gte("created_at", new Date(Date.now() - 86400000 * 7).toISOString());

    if (!payError && recentPayments) {
      for (const pay of recentPayments) {
        const { data: invoice } = await supabase
          .from("invoices")
          .select("id, paid_amount, status")
          .eq("id", pay.invoice_id)
          .single();

        if (invoice && (invoice.status !== "paid" || (Number(invoice.paid_amount) || 0) < Number(pay.amount))) {
          results.push(`PAYMENT-MISMATCH: Payment ${pay.amount} on invoice ${pay.invoice_id} but invoice status=${invoice.status}, paid=${invoice.paid_amount}`);
        }
      }
    }

    // Log results
    if (results.length > 0) {
      Sentry.captureMessage(`Reconciliation found ${results.length} issues:\n${results.join("\n")}`, "warning");
    }

    return NextResponse.json({
      success: true,
      checked_invoices: (unpaidInvoices?.length || 0) + (recentPayments?.length || 0),
      issues_found: results.length,
      details: results,
    });
  } catch (e) {
    Sentry.captureException(e);
    return NextResponse.json({ error: "Reconciliation failed" }, { status: 500 });
  }
}
