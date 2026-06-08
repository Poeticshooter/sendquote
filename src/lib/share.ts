const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in";

export function getWhatsAppShareUrl(quoteUrl: string, quoteNumber: string, clientName: string) {
  const text = `*Quote ${quoteNumber}* from SendQuote\n\nHi ${clientName}, I've sent you a quote. View & sign here:\n${quoteUrl}\n\nPowered by SendQuote`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getEmailShareUrl(quoteUrl: string, quoteNumber: string) {
  const subject = `Quote ${quoteNumber} from SendQuote`;
  const body = `View your quote here: ${quoteUrl}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getQuoteUrl(publicToken: string | null) {
  return `${BASE}/q/${publicToken}`;
}
