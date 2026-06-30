import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage, formatQuoteAccepted, formatQuoteViewed, formatPaymentReceived } from "./bot";

export async function notifyQuoteAccepted(quoteId: string, invoiceNumber?: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data: quote } = await supabase
      .from("quotes")
      .select("quote_number, client_name, total, user_id")
      .eq("id", quoteId)
      .single();

    if (!quote) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("telegram_chat_id")
      .eq("user_id", quote.user_id)
      .single();

    if (profile?.telegram_chat_id) {
      await sendMessage(
        profile.telegram_chat_id,
        formatQuoteAccepted(quote.quote_number, quote.client_name, Number(quote.total), invoiceNumber)
      );
    }
  } catch { /* non-critical */ }
}

export async function notifyQuoteViewed(quoteId: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data: quote } = await supabase
      .from("quotes")
      .select("quote_number, client_name, user_id")
      .eq("id", quoteId)
      .single();

    if (!quote) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("telegram_chat_id")
      .eq("user_id", quote.user_id)
      .single();

    if (profile?.telegram_chat_id) {
      await sendMessage(
        profile.telegram_chat_id,
        formatQuoteViewed(quote.quote_number, quote.client_name)
      );
    }
  } catch { /* non-critical */ }
}

export async function notifyPaymentReceived(quoteNumber: string, amount: number, userId: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("telegram_chat_id")
      .eq("user_id", userId)
      .single();

    if (profile?.telegram_chat_id) {
      await sendMessage(
        profile.telegram_chat_id,
        formatPaymentReceived(quoteNumber, amount)
      );
    }
  } catch { /* non-critical */ }
}
