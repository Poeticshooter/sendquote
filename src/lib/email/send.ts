import nodemailer from "nodemailer";

const RESEND_API = "https://api.resend.com/emails";

interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

let smtpTransporter: nodemailer.Transporter | null = null;

function getSmtpTransport(): nodemailer.Transporter | null {
  if (smtpTransporter) return smtpTransporter;
  const email = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_APP_PASSWORD;
  if (!email || !pass) return null;
  smtpTransporter = nodemailer.createTransport({ service: "gmail", auth: { user: email, pass } });
  return smtpTransporter;
}

export async function sendEmail({ to, subject, html, from, replyTo }: SendEmailParams) {
  const fromAddr = from || process.env.RESEND_FROM || "SendQuote <quotes@sendquote.in>";

  // Try Resend first
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && apiKey !== "placeholder") {
    try {
      const res = await fetch(RESEND_API, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromAddr, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
      });
      if (res.ok) return { success: true as const, id: ((await res.json()) as { id: string }).id };
      const err = await res.text();
      console.warn("Resend failed, trying SMTP:", err);
    } catch (e) {
      console.warn("Resend error, trying SMTP:", e);
    }
  }

  // Fallback to SMTP
  const smtp = getSmtpTransport();
  if (smtp) {
    try {
      await smtp.sendMail({ from: fromAddr, to, subject, html });
      return { success: true as const, id: "smtp" };
    } catch (e) {
      console.error("SMTP also failed:", e);
    }
  }

  console.warn("Email delivery failed — no providers available");
  return { success: false as const, reason: "all_failed" };
}
