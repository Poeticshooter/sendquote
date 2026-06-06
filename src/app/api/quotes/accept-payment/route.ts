import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { public_token, payment_id, amount } = await request.json();
    if (!public_token) {
      return NextResponse.json({ error: "Missing public_token" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: quote } = await supabase
      .from("quotes")
      .select("id, total, invoice_counter, user_id")
      .eq("public_token", public_token)
      .single();

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, status")
      .eq("quote_id", quote.id)
      .limit(1);

    if (invoices && invoices.length > 0) {
      await supabase.from("payments").insert({
        invoice_id: invoices[0].id,
        amount: amount || quote.total,
        payment_method: payment_id ? "razorpay" : "bank_transfer",
        notes: payment_id ? `Payment ID: ${payment_id}` : "Payment (manual/unknown)",
      });

      await supabase.from("invoices").update({
        paid_amount: amount || quote.total,
        balance_due: (quote.total - (amount || quote.total)),
        status: "paid",
      }).eq("id", invoices[0].id);
    }

    await supabase.from("quote_events").insert({
      quote_id: quote.id,
      event_type: payment_id ? "payment_completed" : "payment_deferred",
      metadata: { payment_id, amount: amount || quote.total },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
