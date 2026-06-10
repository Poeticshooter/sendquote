import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getQuotes, createQuote, generateQuoteNumber } from "@/lib/supabase/queries";
import { CreateQuoteSchema } from "@/lib/api-validation";
import { success, parseError, requireAuth, apiError } from "@/lib/api-helper";
import { checkQuoteLimit } from "@/lib/plan-gates";

export async function GET() {
  try {
    await requireAuth();
    const quotes = await getQuotes();
    return success(quotes);
  } catch (e) {
    Sentry.captureException(e);
    return parseError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Enforce plan quote limit
    const { allowed, used, limit } = await checkQuoteLimit();
    if (!allowed) {
      return apiError(`Quote limit reached (${used}/${limit})`, 403);
    }

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
    Sentry.captureException(e);
    return parseError(e);
  }
}
