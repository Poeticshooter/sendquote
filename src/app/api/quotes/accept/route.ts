import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncQuoteToCrm } from "@/lib/crm/sync";
import { AcceptQuoteSchema } from "@/lib/api-validation";
import { parseError } from "@/lib/api-helper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_token, signatory_name, signatory_email, signature_data } = AcceptQuoteSchema.parse(body);

    const supabase = createAdminClient();
    const { data: quote } = await supabase
      .from("quotes")
      .select("*, profiles(business_name)")
      .eq("public_token", public_token)
      .single();

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (quote.status === "accepted") {
      return NextResponse.json({ error: "Quote already accepted" }, { status: 409 });
    }

    const { error: sigError } = await supabase.from("quote_signatures").insert({
      quote_id: quote.id,
      signatory_name: signatory_name || "Client",
      signatory_email: signatory_email || "",
      signature_data,
    });

    if (sigError) throw sigError;

    // Optimistic update: only accept if still in "sent" status (race condition guard)
    const { data: updatedQuote, error: updateError } = await supabase
      .from("quotes")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", quote.id)
      .eq("status", "sent")
      .select()
      .single();

    if (updateError || !updatedQuote) {
      // Another request already handled this (0 rows affected)
      return NextResponse.json({ error: "Quote already accepted" }, { status: 409 });
    }

    const date = new Date();
    const invoiceNumber = `INV-${date.getFullYear()}-${date.getMonth() + 1}-${Date.now().toString(36).toUpperCase()}`;

    const { error: invError } = await supabase.from("invoices").insert({
      user_id: quote.user_id,
      quote_id: quote.id,
      invoice_number: invoiceNumber,
      client_name: quote.client_name,
      client_email: quote.client_email,
      amount: quote.total,
      subtotal: quote.subtotal,
      gst_rate: quote.gst_rate,
      gst_amount: quote.gst_amount,
      paid_amount: 0,
      balance_due: quote.total,
      status: "pending",
      organization_id: quote.organization_id,
    });

    if (invError) throw invError;

    await supabase.from("quote_events").insert({
      quote_id: quote.id,
      event_type: "accepted",
      metadata: { signatory_name, invoice_number: invoiceNumber },
    });

    syncQuoteToCrm({
      id: quote.id,
      quote_number: quote.quote_number,
      client_name: quote.client_name,
      client_email: quote.client_email,
      total: quote.total,
      status: "accepted",
      public_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/q/${quote.public_token}`,
      created_at: quote.created_at,
    }).catch((e) => console.error("CRM sync failed after acceptance:", e));

    return NextResponse.json({ success: true, invoice_number: invoiceNumber });
  } catch (e) {
    return parseError(e);
  }
}
