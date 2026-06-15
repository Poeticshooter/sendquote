import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, parseError } from "@/lib/api-helper";
import { QuotePDF } from "@/components/quotes/quote-pdf";
import { renderToStream } from "@react-pdf/renderer";
import { generateUpiQrDataUrl } from "@/lib/upi";

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
      .select("business_name, gst_number, address, phone, upi_id, smtp_email")
      .eq("user_id", user.id)
      .single();

    const items = (quote.quote_items || []).map(
      (i: { description?: string; spec?: string; quantity?: number; rate?: number; hsn_code?: string }) => ({
        description: i.description || "",
        spec: i.spec || "",
        quantity: i.quantity || 0,
        rate: Number(i.rate) || 0,
        amount: (i.quantity || 0) * (Number(i.rate) || 0),
        hsnCode: i.hsn_code || undefined,
      })
    );

    // Generate UPI QR if user has UPI ID configured
    let upiQrDataUrl: string | undefined;
    if (profile?.upi_id) {
      try {
        upiQrDataUrl = await generateUpiQrDataUrl({
          upiId: profile.upi_id,
          businessName: profile?.business_name || "Business",
          amount: Number(quote.total) || 0,
          invoiceNumber: quote.quote_number,
        });
      } catch {
        // QR generation failure is non-critical — continue without QR
      }
    }

    const stream = await renderToStream(
      <QuotePDF
        quoteNumber={quote.quote_number}
        clientName={quote.client_name}
        clientAddress={quote.client_address || undefined}
        clientGst={undefined}
        items={items}
        subtotal={Number(quote.subtotal) || 0}
        discount={Number(quote.discount) || undefined}
        gstRate={quote.gst_rate}
        cgstRate={quote.cgst_rate}
        cgstAmount={Number(quote.cgst_amount) || 0}
        sgstRate={quote.sgst_rate}
        sgstAmount={Number(quote.sgst_amount) || 0}
        igstRate={quote.igst_rate}
        igstAmount={Number(quote.igst_amount) || 0}
        total={Number(quote.total) || 0}
        businessName={profile?.business_name || "Your Business"}
        businessAddress={profile?.address || undefined}
        businessGst={profile?.gst_number || undefined}
        businessPhone={profile?.phone || undefined}
        businessEmail={profile?.smtp_email || undefined}
        subject={quote.subject || undefined}
        notes={quote.notes || undefined}
        terms={quote.terms || undefined}
        upiId={profile?.upi_id || undefined}
        upiQrDataUrl={upiQrDataUrl}
        expiryDate={quote.valid_until || undefined}
        status={quote.status}
      />
    );

    const filename = `SendQuote-${quote.quote_number}-${quote.client_name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return parseError(e);
  }
}
