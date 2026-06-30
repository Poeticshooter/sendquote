const TELEGRAM_API = "https://api.telegram.org/bot";

function getToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

function getApiUrl(method: string): string {
  const token = getToken();
  if (!token) return "";
  return `${TELEGRAM_API}${token}/${method}`;
}

export async function sendMessage(chatId: string | number, text: string, opts?: { parse_mode?: "HTML" | "Markdown"; reply_markup?: unknown }): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    const res = await fetch(getApiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: opts?.parse_mode || "HTML",
        ...(opts?.reply_markup ? { reply_markup: opts.reply_markup } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function formatQuoteAccepted(quoteNumber: string, clientName: string, total: number, invoiceNumber?: string): string {
  return `<b>✅ Deal Closed!</b>\n\nQuote <b>${quoteNumber}</b> accepted by ${clientName}\nValue: ₹${total.toLocaleString("en-IN")}${invoiceNumber ? `\nInvoice: ${invoiceNumber}` : ""}`;
}

export function formatQuoteViewed(quoteNumber: string, clientName: string): string {
  return `<b>👀 Quote Viewed</b>\n\n${clientName} opened <b>${quoteNumber}</b>`;
}

export function formatPaymentReceived(quoteNumber: string, amount: number): string {
  return `<b>💰 Payment Received</b>\n\n₹${amount.toLocaleString("en-IN")} for ${quoteNumber}`;
}

export function formatWeeklyDigest(quotesSent: number, accepted: number, collected: number, outstanding: number): string {
  return `<b>📊 Weekly Summary</b>\n\nQuotes sent: ${quotesSent}\nClosed: ${accepted}\nCollected: ₹${collected.toLocaleString("en-IN")}\nOutstanding: ₹${outstanding.toLocaleString("en-IN")}`;
}

export function formatHelp(): string {
  return `<b>SendQuote Bot</b>

Get real-time notifications about your quotes and deals.

<b>Available commands:</b>
/stats — Your weekly quote stats
/help — Show this message

Notifications are sent automatically when:
• A client views your quote 👀
• A deal is closed ✅
• A payment is received 💰`;
}
