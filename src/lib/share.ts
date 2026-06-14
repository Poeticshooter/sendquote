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
  if (!publicToken) throw new Error("Cannot generate URL: no public token");
  return `${BASE}/q/${publicToken}`;
}

/**
 * WhatsApp message templates with Indian SMB context.
 * These generate a pre-filled wa.me URL with professional copy.
 */
export function getWhatsAppQuoteMessage(params: {
  clientName: string;
  businessName: string;
  subject?: string;
  quoteNumber: string;
  quoteUrl: string;
  total: number;
  validUntil?: string;
}) {
  const subject = params.subject ? ` for ${params.subject}` : "";
  const validDate = params.validUntil ? ` — Valid until ${params.validUntil}` : "";
  const total = `₹${Math.round(params.total).toLocaleString("en-IN")}`;
  const text =
    `Dear ${params.clientName},` +
    `\n\nPlease find your quotation${subject} from ${params.businessName}:` +
    `\n📄 *${params.quoteNumber}* — ${total}${validDate}` +
    `\n\nView & respond here: ${params.quoteUrl}` +
    `\n\nRegards,\n${params.businessName}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getWhatsAppInvoiceMessage(params: {
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  invoiceUrl: string;
  amount: number;
  dueDate?: string;
}) {
  const due = params.dueDate ? ` — Due by ${params.dueDate}` : "";
  const amount = `₹${Math.round(params.amount).toLocaleString("en-IN")}`;
  const text =
    `Dear ${params.clientName},` +
    `\n\nInvoice *${params.invoiceNumber}* from ${params.businessName} — ${amount}${due}` +
    `\n\nKindly arrange payment at your earliest convenience. Click to view & pay: ${params.invoiceUrl}` +
    `\n\nRegards,\n${params.businessName}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getWhatsAppPaymentReminder(params: {
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  invoiceUrl: string;
  amount: number;
  daysOverdue: number;
}) {
  const amount = `₹${Math.round(params.amount).toLocaleString("en-IN")}`;
  const text =
    `*Friendly Reminder*` +
    `\n\nDear ${params.clientName},` +
    `\n\nThis is a reminder that Invoice *${params.invoiceNumber}* for ${amount} is ${params.daysOverdue} days overdue.` +
    `\n\nPlease arrange payment at your earliest convenience: ${params.invoiceUrl}` +
    `\n\nIf you've already paid, please ignore this message.\n\nRegards,\n${params.businessName}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
