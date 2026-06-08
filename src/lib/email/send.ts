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
  if (!apiKey || apiKey === "placeholder") {
    console.warn("Resend not configured — email not sent");
    return { success: false, reason: "not_configured" };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from || "SendQuote <quotes@sendquote.in>",
        to,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend API error:", err);
      return { success: false, reason: "api_error", details: err };
    }

    const data = await res.json();
    return { success: true, id: data.id };
  } catch (e) {
    console.error("Failed to send email:", e);
    return { success: false, reason: "exception", details: String(e) };
  }
}
