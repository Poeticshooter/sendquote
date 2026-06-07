import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateContractHtml } from "@/lib/contracts/generate";
import { parseError, requireAuth } from "@/lib/api-helper";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const user = await requireAuth();
    const { quoteId } = await params;

    const supabase = await createClient();

    const { data: ownerCheck } = await supabase
      .from("quotes")
      .select("user_id")
      .eq("id", quoteId)
      .single();

    if (!ownerCheck) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    if (ownerCheck.user_id !== user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const adminDb = createAdminClient();
    const { data: quote } = await adminDb
      .from("quotes")
      .select("*, quote_items(*), quote_signatures(*), profiles(business_name)")
      .eq("id", quoteId)
      .single();

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    type QuoteWithJoins = typeof quote & {
      quote_signatures?: { signatory_name: string; created_at: string }[];
      quote_items?: { description: string; quantity: number; rate: number; amount: number }[];
      profiles?: { business_name: string } | null;
    };
    const q = quote as QuoteWithJoins;

    const signature = q.quote_signatures?.[0];
    const html = generateContractHtml({
      quoteNumber: q.quote_number,
      clientName: q.client_name,
      clientEmail: q.client_email,
      businessName: q.profiles?.business_name || "Provider",
      items: (q.quote_items || []).map((i) => ({
        description: i.description,
        quantity: i.quantity,
        rate: i.rate,
        amount: i.amount,
      })),
      subtotal: quote.subtotal,
      gstRate: quote.gst_rate,
      gstAmount: quote.gst_amount,
      total: quote.total,
      notes: quote.notes,
      terms: quote.terms,
      signatoryName: signature?.signatory_name || "Client",
      signedAt: signature?.created_at || q.updated_at,
      validUntil: q.valid_until,
    });

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (e) {
    return parseError(e);
  }
}
