import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getQuotes, createQuote, generateQuoteNumber } from "@/lib/supabase/queries";
import { CreateQuoteSchema } from "@/lib/api-validation";
import { success, parseError, requireAuth, apiError } from "@/lib/api-helper";
import { checkQuoteLimit } from "@/lib/plan-gates";
import { trackEvent } from "@/lib/analytics";

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
      client_address: data.client_address || undefined,
      items: data.items,
      notes: data.notes || undefined,
      terms: data.terms || undefined,
      payment_terms: data.payment_terms || undefined,
      valid_until: data.valid_until || undefined,
      gst_rate: data.gst_rate,
      discount: data.discount,
      discount_type: data.discount_type,
      is_inter_state: data.is_inter_state,
      place_of_supply: data.place_of_supply || undefined,
      organization_id: data.organization_id || undefined,
    });

    // Track: quote created
    trackEvent("quote_created", { hasItems: data.items.length > 0, userId: user.id });

    return success(quote, 201);
  } catch (e) {
    Sentry.captureException(e);
    return parseError(e);
  }
}
