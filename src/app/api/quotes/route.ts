import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQuotes, createQuote, generateQuoteNumber } from "@/lib/supabase/queries";
import { CreateQuoteSchema } from "@/lib/api-validation";
import { success, parseError, requireAuth } from "@/lib/api-helper";

export async function GET() {
  try {
    const quotes = await getQuotes();
    return success(quotes);
  } catch (e) {
    return parseError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = CreateQuoteSchema.parse(body);
    const quoteNumber = await generateQuoteNumber(user.id);

    const quote = await createQuote({
      user_id: user.id,
      quote_number: quoteNumber,
      client_name: data.client_name,
      client_email: data.client_email || undefined,
      client_phone: data.client_phone || undefined,
      items: data.items,
      notes: data.notes || undefined,
      terms: data.terms || undefined,
      payment_terms: data.payment_terms || undefined,
      valid_until: data.valid_until || undefined,
      gst_rate: data.gst_rate,
      organization_id: data.organization_id || undefined,
    });

    return success(quote, 201);
  } catch (e) {
    return parseError(e);
  }
}
