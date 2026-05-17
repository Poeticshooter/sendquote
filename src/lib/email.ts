import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { logger } from './logger'
import { env } from './env'

const SITE_URL = env.siteUrl
const FROM_EMAIL = env.emailFrom || 'onboarding@resend.dev'

let smtpTransport: nodemailer.Transporter | null = null
let resendClient: Resend | null = null

function getSmtpTransport(): nodemailer.Transporter | null {
  if (smtpTransport) return smtpTransport

  const smtpEmail = env.smtpEmail
  const smtpAppPassword = env.smtpAppPassword

  if (!smtpEmail || !smtpAppPassword) return null

  smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpEmail,
      pass: smtpAppPassword,
    },
  })

  return smtpTransport
}

function getResendClient(): Resend | null {
  if (resendClient) return resendClient
  const key = env.resendApiKey
  if (!key) return null
  resendClient = new Resend(key)
  return resendClient
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function emailTemplate(body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>SendQuote</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, html { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
    .main { background-color: #ffffff; margin: 0 auto; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .header { background-color: #4f46e5; padding: 32px 40px; text-align: center; }
    .content { padding: 40px; }
    .footer { background-color: #f8fafc; padding: 24px 40px; text-align: center; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .btn:hover { background-color: #4338ca; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .text-secondary { color: #64748b; }
    .text-small { font-size: 12px; }
    @media only screen and (max-width: 620px) {
      .main { width: 100% !important; border-radius: 0 !important; }
      .content { padding: 24px !important; }
      .header { padding: 24px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc;">
  <center class="wrapper" style="width:100%; table-layout:fixed; background-color:#f8fafc; padding-bottom:40px;">
    <table class="main" style="background-color:#ffffff; margin:0 auto; max-width:600px; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <tr>
        <td class="header" style="background-color:#4f46e5; padding:32px 40px; text-align:center;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="text-align:center;">
                <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                  <tr>
                    <td style="width:36px; height:36px; background-color:#4f46e5; border-radius:8px; text-align:center; vertical-align:middle;">
                      <span style="color:#ffffff; font-size:18px; font-weight:bold; line-height:36px;">SQ</span>
                    </td>
                    <td style="padding-left:12px; vertical-align:middle;">
                      <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:-0.02em;">SendQuote</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td class="content" style="padding:40px;">
          ${body}
        </td>
      </tr>
      <tr>
        <td class="footer" style="background-color:#f8fafc; padding:24px 40px; text-align:center;">
          <p class="text-secondary text-small" style="color:#64748b; font-size:12px; margin:0 0 8px 0;">
            &copy; ${new Date().getFullYear()} SendQuote. Built in India.
          </p>
          <p class="text-secondary text-small" style="color:#64748b; font-size:12px; margin:0;">
            <a href="${SITE_URL}" style="color:#4f46e5; text-decoration:none;">sendquote.in</a>
          </p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`
}

export interface EmailConfig {
  smtpEmail?: string | null
  smtpAppPassword?: string | null
}

export async function sendEmail(
  config: EmailConfig | undefined,
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const from = `SendQuote <${FROM_EMAIL}>`

  // Try SMTP (Gmail) first — either global env or per-user config
  const smtpEmail = config?.smtpEmail || env.smtpEmail
  const smtpAppPassword = config?.smtpAppPassword || env.smtpAppPassword

  if (smtpEmail && smtpAppPassword) {
    try {
      const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpEmail, pass: smtpAppPassword },
      })
      await transport.sendMail({ from, to, subject, html })
      logger.info('Email sent via SMTP', { to, subject })
      return
    } catch (err) {
      logger.warn('SMTP send failed, falling back to Resend', {
        to,
        subject,
        error: err instanceof Error ? err.message : 'unknown',
      })
    }
  }

  // Fallback: global SMTP transport
  const globalSmtp = getSmtpTransport()
  if (globalSmtp) {
    try {
      await globalSmtp.sendMail({ from, to, subject, html })
      logger.info('Email sent via global SMTP', { to, subject })
      return
    } catch (err) {
      logger.warn('Global SMTP send failed, falling back to Resend', {
        to,
        subject,
        error: err instanceof Error ? err.message : 'unknown',
      })
    }
  }

  // Final fallback: Resend
  const resend = getResendClient()
  if (resend) {
    try {
      await resend.emails.send({ from, to, subject, html })
      logger.info('Email sent via Resend', { to, subject })
      return
    } catch (err) {
      logger.error('Resend send failed', {
        to,
        subject,
        error: err instanceof Error ? err.message : 'unknown',
      })
      throw err
    }
  }

  // No email provider configured
  logger.error('No email provider configured — email not sent', { to, subject })
  throw new Error('No email provider configured (set SMTP_EMAIL + SMTP_APP_PASSWORD or RESEND_API_KEY)')
}

export async function notifyQuoteOpened(
  email: string,
  clientName: string,
  quoteNumber: string,
  config: EmailConfig = {}
) {
  const body = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding-bottom:8px;">
          <span style="display:inline-block; width:48px; height:48px; background-color:#ecfdf5; border-radius:12px; text-align:center; line-height:48px; font-size:24px;">👁️</span>
        </td>
      </tr>
      <tr>
        <td>
          <h1 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:#0f172a;">Quote Opened!</h1>
        </td>
      </tr>
      <tr>
        <td>
          <p style="margin:0 0 16px 0; color:#64748b; font-size:15px; line-height:1.6;">
            <strong style="color:#0f172a;">${escapeHtml(clientName)}</strong> has opened your quote <strong style="color:#0f172a;">#${escapeHtml(quoteNumber)}</strong>.
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <p style="margin:0 0 24px 0; color:#64748b; font-size:15px; line-height:1.6;">
            This is the perfect time to follow up — call them now!
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding-top:16px;">
          <a href="${SITE_URL}/dashboard" class="btn" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600; font-size:14px;">View Dashboard</a>
        </td>
      </tr>
    </table>
  `
  await sendEmail(config, email, `Quote #${quoteNumber} opened by ${clientName}`, emailTemplate(body))
}

export async function notifyQuoteAccepted(
  email: string,
  clientName: string,
  quoteNumber: string,
  config: EmailConfig = {}
) {
  const body = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding-bottom:8px;">
          <span style="display:inline-block; width:48px; height:48px; background-color:#ecfdf5; border-radius:12px; text-align:center; line-height:48px; font-size:24px;">🎉</span>
        </td>
      </tr>
      <tr>
        <td>
          <h1 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:#0f172a;">Quote Accepted!</h1>
        </td>
      </tr>
      <tr>
        <td>
          <p style="margin:0 0 16px 0; color:#64748b; font-size:15px; line-height:1.6;">
            Congratulations! <strong style="color:#0f172a;">${escapeHtml(clientName)}</strong> has accepted your quote <strong style="color:#0f172a;">#${escapeHtml(quoteNumber)}</strong>.
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <p style="margin:0 0 24px 0; color:#64748b; font-size:15px; line-height:1.6;">
            The quote is now marked as accepted. You can proceed with the next steps.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding-top:16px;">
          <a href="${SITE_URL}/dashboard" class="btn" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600; font-size:14px;">View Dashboard</a>
        </td>
      </tr>
    </table>
  `
  await sendEmail(config, email, `Quote #${quoteNumber} accepted by ${clientName}`, emailTemplate(body))
}

export async function notifyChangesRequested(
  email: string,
  clientName: string,
  quoteNumber: string,
  message: string,
  config: EmailConfig = {}
) {
  const body = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding-bottom:8px;">
          <span style="display:inline-block; width:48px; height:48px; background-color:#fef3c7; border-radius:12px; text-align:center; line-height:48px; font-size:24px;">✏️</span>
        </td>
      </tr>
      <tr>
        <td>
          <h1 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:#0f172a;">Changes Requested</h1>
        </td>
      </tr>
      <tr>
        <td>
          <p style="margin:0 0 16px 0; color:#64748b; font-size:15px; line-height:1.6;">
            <strong style="color:#0f172a;">${escapeHtml(clientName)}</strong> requested changes on quote <strong style="color:#0f172a;">#${escapeHtml(quoteNumber)}</strong>.
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <hr style="border:none; border-top:1px solid #e2e8f0; margin:16px 0;">
          <p style="margin:0; color:#0f172a; font-size:14px; line-height:1.6; background-color:#f8fafc; padding:16px; border-radius:8px;">
            ${escapeHtml(message)}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding-top:24px;">
          <a href="${SITE_URL}/dashboard" class="btn" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600; font-size:14px;">View Quote</a>
        </td>
      </tr>
    </table>
  `
  await sendEmail(config, email, `Changes requested on quote #${quoteNumber}`, emailTemplate(body))
}

export async function remindFollowUp(
  email: string,
  clientName: string,
  quoteNumber: string,
  config: EmailConfig = {}
) {
  const body = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding-bottom:8px;">
          <span style="display:inline-block; width:48px; height:48px; background-color:#eff6ff; border-radius:12px; text-align:center; line-height:48px; font-size:24px;">⏰</span>
        </td>
      </tr>
      <tr>
        <td>
          <h1 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:#0f172a;">Follow Up Reminder</h1>
        </td>
      </tr>
      <tr>
        <td>
          <p style="margin:0 0 16px 0; color:#64748b; font-size:15px; line-height:1.6;">
            Your quote <strong style="color:#0f172a;">#${escapeHtml(quoteNumber)}</strong> to <strong style="color:#0f172a;">${escapeHtml(clientName)}</strong> has not been opened yet (48+ hours).
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <p style="margin:0 0 24px 0; color:#64748b; font-size:15px; line-height:1.6;">
            Consider sending a follow-up message or calling them directly.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding-top:16px;">
          <a href="${SITE_URL}/dashboard" class="btn" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600; font-size:14px;">View Dashboard</a>
        </td>
      </tr>
    </table>
  `
  await sendEmail(config, email, `Follow up: ${clientName} hasn't opened your quote yet`, emailTemplate(body))
}

export async function remindAfterOpen(
  email: string,
  clientName: string,
  quoteNumber: string,
  config: EmailConfig = {}
) {
  const body = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding-bottom:8px;">
          <span style="display:inline-block; width:48px; height:48px; background-color:#fef3c7; border-radius:12px; text-align:center; line-height:48px; font-size:24px;">📞</span>
        </td>
      </tr>
      <tr>
        <td>
          <h1 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:#0f172a;">Time to Follow Up!</h1>
        </td>
      </tr>
      <tr>
        <td>
          <p style="margin:0 0 16px 0; color:#64748b; font-size:15px; line-height:1.6;">
            <strong style="color:#0f172a;">${escapeHtml(clientName)}</strong> opened your quote <strong style="color:#0f172a;">#${escapeHtml(quoteNumber)}</strong> 24 hours ago but hasn't responded yet.
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <p style="margin:0 0 24px 0; color:#64748b; font-size:15px; line-height:1.6;">
            This is a great time to follow up!
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding-top:16px;">
          <a href="${SITE_URL}/dashboard" class="btn" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600; font-size:14px;">View Dashboard</a>
        </td>
      </tr>
    </table>
  `
  await sendEmail(config, email, `${clientName} opened your quote 24h ago — follow up now`, emailTemplate(body))
}

export async function remindExpiry(
  email: string,
  clientName: string,
  quoteNumber: string,
  config: EmailConfig = {}
) {
  const body = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding-bottom:8px;">
          <span style="display:inline-block; width:48px; height:48px; background-color:#fef2f2; border-radius:12px; text-align:center; line-height:48px; font-size:24px;">⚠️</span>
        </td>
      </tr>
      <tr>
        <td>
          <h1 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:#0f172a;">Quote Expiring Soon</h1>
        </td>
      </tr>
      <tr>
        <td>
          <p style="margin:0 0 16px 0; color:#64748b; font-size:15px; line-height:1.6;">
            Your quote <strong style="color:#0f172a;">#${escapeHtml(quoteNumber)}</strong> to <strong style="color:#0f172a;">${escapeHtml(clientName)}</strong> expires tomorrow.
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <p style="margin:0 0 24px 0; color:#64748b; font-size:15px; line-height:1.6;">
            Follow up before it expires!
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding-top:16px;">
          <a href="${SITE_URL}/dashboard" class="btn" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600; font-size:14px;">View Dashboard</a>
        </td>
      </tr>
    </table>
  `
  await sendEmail(config, email, `Quote #${quoteNumber} to ${clientName} expires tomorrow`, emailTemplate(body))
}
