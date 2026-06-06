import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQuotes, createQuote, generateQuoteNumber } from "@/lib/supabase/queries";

export async function GET() {
  try {
    const quotes = await getQuotes();
    return NextResponse.json(quotes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const quoteNumber = await generateQuoteNumber(user.id);

    const quote = await createQuote({
      user_id: user.id,
      quote_number: quoteNumber,
      client_name: body.client_name,
      client_email: body.client_email,
      client_phone: body.client_phone,
      items: body.items || [],
      notes: body.notes,
      terms: body.terms,
      payment_terms: body.payment_terms,
      valid_until: body.valid_until,
      gst_rate: body.gst_rate,
      organization_id: body.organization_id,
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
