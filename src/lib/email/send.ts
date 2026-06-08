const RESEND_API = "https://api.resend.com/emails";

interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, from, replyTo }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddr = from || process.env.RESEND_FROM || "SendQuote <quotes@sendquote.in>";

  if (!apiKey || apiKey === "placeholder") {
    console.log("[Email] Not configured. Would send:", { to, subject });
    return { success: false as const, reason: "not_configured" };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromAddr, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return { success: false as const, reason: "api_error", details: err };
    }

    return { success: true as const, id: ((await res.json()) as { id: string }).id };
  } catch (e) {
    console.error("Email send failed:", e);
    return { success: false as const, reason: "exception", details: String(e) };
  }
}
