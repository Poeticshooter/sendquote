import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const supabase = createAdminClient();
    const { data: quotes } = await supabase
      .from("quotes")
      .select("*, invoices(*), payments(invoice_id, amount)")
      .eq("client_email", email)
      .order("created_at", { ascending: false });

    if (!quotes || quotes.length === 0) {
      return NextResponse.json({ quotes: [], message: "No records found for this email" });
    }

    const portalData = quotes.map((q: any) => ({
      id: q.id,
      quoteNumber: q.quote_number,
      clientName: q.client_name,
      status: q.status,
      total: q.total,
      createdAt: q.created_at,
      publicUrl: `/q/${q.public_token}`,
      contractUrl: q.status === "accepted" ? `/api/contracts/${q.id}` : null,
      invoices: (q.invoices || []).map((inv: any) => ({
        number: inv.invoice_number,
        amount: inv.amount,
        status: inv.status,
        paidAmount: inv.paid_amount,
      })),
      paymentCount: (q.payments || []).length,
    }));

    return NextResponse.json({ quotes: portalData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
