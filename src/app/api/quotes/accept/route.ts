import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncQuoteToCrm } from "@/lib/crm/sync";

export async function POST(request: NextRequest) {
  try {
    const { public_token, signatory_name, signatory_email, signature_data } = await request.json();
    if (!public_token || !signature_data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: quote } = await supabase
      .from("quotes")
      .select("*, profiles(business_name)")
      .eq("public_token", public_token)
      .single();

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    await supabase.from("quote_signatures").insert({
      quote_id: quote.id,
      signatory_name: signatory_name || "Client",
      signatory_email: signatory_email || "",
      signature_data,
    });

    await supabase
      .from("quotes")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", quote.id);

    const date = new Date();
    const invoiceNumber = `INV-${date.getFullYear()}-${date.getMonth() + 1}-${Date.now().toString(36).toUpperCase()}`;

    await supabase.from("invoices").insert({
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
    }).catch(() => {});

    return NextResponse.json({ success: true, invoice_number: invoiceNumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
