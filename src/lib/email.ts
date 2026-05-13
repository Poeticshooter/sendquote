import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.EMAIL_FROM_ADDRESS || 'quotes@resend.dev'

// To: sender — client opened the quote
export async function notifyQuoteOpened(
  email: string,
  clientName: string,
  quoteNumber: string
) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `👀 ${clientName} opened your quote #${quoteNumber}`,
    html: `<p><strong>${clientName}</strong> has opened your quote <strong>#${quoteNumber}</strong>.</p>
<p>This is the perfect time to follow up — call them now!</p>`,
  })
}

// To: sender — client accepted the quote
export async function notifyQuoteAccepted(
  email: string,
  clientName: string,
  quoteNumber: string
) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `✅ ${clientName} accepted your quote #${quoteNumber}`,
    html: `<p><strong>${clientName}</strong> has accepted your quote <strong>#${quoteNumber}</strong>.</p>
<p>Congratulations! The quote is now marked as accepted.</p>`,
  })
}

// To: sender — client requested changes
export async function notifyChangesRequested(
  email: string,
  clientName: string,
  quoteNumber: string,
  message: string
) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `✏️ ${clientName} requested changes on #${quoteNumber}`,
    html: `<p><strong>${clientName}</strong> requested changes on <strong>#${quoteNumber}</strong>.</p>
<p><strong>Message:</strong> ${message}</p>`,
  })
}

// To: sender — follow-up reminder (quote not opened after 48h)
export async function remindFollowUp(
  email: string,
  clientName: string,
  quoteNumber: string
) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `⏰ Follow up: ${clientName} hasn't opened your quote yet`,
    html: `<p>Your quote <strong>#${quoteNumber}</strong> to <strong>${clientName}</strong> has not been opened yet (48+ hours).</p>
<p>Consider sending a follow-up message or calling them directly.</p>`,
  })
}

// To: sender — quote accepted but no action for 24h
export async function remindAfterOpen(
  email: string,
  clientName: string,
  quoteNumber: string
) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `⏰ ${clientName} opened your quote 24h ago — follow up now`,
    html: `<p><strong>${clientName}</strong> opened your quote <strong>#${quoteNumber}</strong> 24 hours ago but hasn't responded yet.</p>
<p>This is a great time to follow up!</p>`,
  })
}

// To: sender — quote expiring tomorrow
export async function remindExpiry(
  email: string,
  clientName: string,
  quoteNumber: string
) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `⚠️ Quote #${quoteNumber} to ${clientName} expires tomorrow`,
    html: `<p>Your quote <strong>#${quoteNumber}</strong> to <strong>${clientName}</strong> expires tomorrow.</p>
<p>Follow up before it expires!</p>`,
  })
}
