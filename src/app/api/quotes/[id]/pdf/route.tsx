import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, parseError } from "@/lib/api-helper";
import { QuotePDF } from "@/components/quotes/quote-pdf";
import { renderToStream } from "@react-pdf/renderer";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const supabase = await createClient();
    const { data: quote, error } = await supabase
      .from("quotes")
      .select("*, quote_items(*)")
      .eq("id", id)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    if (quote.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("business_name, gst_number")
      .eq("user_id", user.id)
      .single();

    const items = (quote.quote_items || []).map(
      (i: { description?: string; quantity?: number; rate?: number }) => ({
        description: i.description || "",
        quantity: i.quantity || 0,
        rate: Number(i.rate) || 0,
        amount: (i.quantity || 0) * (Number(i.rate) || 0),
      })
    );

    const stream = await renderToStream(
      <QuotePDF
        quoteNumber={quote.quote_number}
        clientName={quote.client_name}
        items={items}
        subtotal={Number(quote.subtotal) || 0}
        gstRate={quote.gst_rate}
        gstAmount={Number(quote.gst_amount) || 0}
        total={Number(quote.total) || 0}
        businessName={profile?.business_name || "Your Business"}
        businessGst={profile?.gst_number}
        expiryDate={quote.valid_until}
        status={quote.status}
      />
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quote-${quote.quote_number}.pdf"`,
      },
    });
  } catch (e) {
    return parseError(e);
  }
}
