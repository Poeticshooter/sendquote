const BASE_STYLES = {
  body: "margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;",
  container: "max-width:600px;margin:0 auto;padding:40px 20px;",
  card: "background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:40px;",
  heading: "color:#F5F5F5;font-size:24px;font-weight:700;margin:0 0 8px 0;",
  text: "color:#808080;font-size:15px;line-height:1.6;margin:0 0 20px 0;",
  button: "display:inline-block;padding:14px 32px;background:#00D4AA;color:#0A0A0A;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;",
  footer: "color:#606060;font-size:12px;text-align:center;margin-top:32px;",
  divider: "border:0;border-top:1px solid rgba(255,255,255,0.06);margin:24px 0;",
};

export function wrapEmail(content: string) {
  return `<div style="${BASE_STYLES.body}">
    <div style="${BASE_STYLES.container}">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="https://sendquote.in/logo-icon.svg" alt="SendQuote" width="48" height="48" style="border-radius:12px;" />
      </div>
      <div style="${BASE_STYLES.card}">
        ${content}
      </div>
      <div style="${BASE_STYLES.footer}">
        <p style="margin:0 0 4px 0;">SendQuote — AI-Powered Revenue Workflow Platform</p>
        <p style="margin:0;">support@sendquote.in · <a href="https://sendquote.in" style="color:#00D4AA;text-decoration:none;">sendquote.in</a></p>
      </div>
    </div>
  </div>`;
}

export function quoteReceivedEmail(quoteNumber: string, businessName: string, total: string, currency: string, quoteUrl: string) {
  const totalFormatted = currency === "INR" ? `₹${total}` : `$${total}`;
  return wrapEmail(`
    <h1 style="${BASE_STYLES.heading}">You've received a quote</h1>
    <p style="${BASE_STYLES.text}">
      <strong style="color:#F5F5F5;">${businessName}</strong> has sent you a quote.
    </p>
    <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#808080;font-size:13px;margin:0 0 4px 0;">Quote Number</p>
      <p style="color:#F5F5F5;font-size:20px;font-weight:700;margin:0 0 16px 0;">${quoteNumber}</p>
      <p style="color:#808080;font-size:13px;margin:0 0 4px 0;">Total Amount</p>
      <p style="color:#00D4AA;font-size:28px;font-weight:700;margin:0;">${totalFormatted}</p>
    </div>
    <div style="text-align:center;">
      <a href="${quoteUrl}" style="${BASE_STYLES.button}">
        View & Sign Quote
      </a>
    </div>
    <hr style="${BASE_STYLES.divider}" />
    <p style="${BASE_STYLES.text}font-size:13px;">
      This quote includes interactive features: e-signature, payment collection, and real-time messaging.
    </p>
  `);
}

export function quoteAcceptedEmail(quoteNumber: string, clientName: string, total: string, currency: string, dashboardUrl: string) {
  const totalFormatted = currency === "INR" ? `₹${total}` : `$${total}`;
  return wrapEmail(`
    <h1 style="${BASE_STYLES.heading}">Quote Accepted! 🎉</h1>
    <p style="${BASE_STYLES.text}">
      <strong style="color:#F5F5F5;">${clientName}</strong> has accepted your quote <strong style="color:#F5F5F5;">${quoteNumber}</strong>.
    </p>
    <div style="background:rgba(0,212,170,0.08);border:1px solid rgba(0,212,170,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#808080;font-size:13px;margin:0 0 4px 0;">Deal Value</p>
      <p style="color:#00D4AA;font-size:28px;font-weight:700;margin:0;">${totalFormatted}</p>
    </div>
    <div style="text-align:center;">
      <a href="${dashboardUrl}" style="${BASE_STYLES.button}">
        View in Dashboard
      </a>
    </div>
  `);
}

export function teamInviteEmail(inviterName: string, organizationName: string, inviteUrl: string) {
  return wrapEmail(`
    <h1 style="${BASE_STYLES.heading}">You've been invited</h1>
    <p style="${BASE_STYLES.text}">
      <strong style="color:#F5F5F5;">${inviterName}</strong> has invited you to join <strong style="color:#F5F5F5;">${organizationName}</strong> on SendQuote.
    </p>
    <p style="${BASE_STYLES.text}">
      Collaborate on quotes, manage clients, and track deals together.
    </p>
    <div style="text-align:center;">
      <a href="${inviteUrl}" style="${BASE_STYLES.button}">
        Accept Invitation
      </a>
    </div>
  `);
}

export function passwordResetEmail(resetUrl: string) {
  return wrapEmail(`
    <h1 style="${BASE_STYLES.heading}">Reset your password</h1>
    <p style="${BASE_STYLES.text}">
      We received a request to reset your SendQuote password. Click the button below to set a new password.
    </p>
    <p style="${BASE_STYLES.text}font-size:13px;color:#606060;">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
    </p>
    <div style="text-align:center;">
      <a href="${resetUrl}" style="${BASE_STYLES.button}">
        Reset Password
      </a>
    </div>
  `);
}
