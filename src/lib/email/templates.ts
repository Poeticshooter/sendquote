const S = {
  body: 'margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;',
  outerTable: 'width:100%;border-collapse:collapse;background-color:#0A0A0A;',
  container: 'max-width:560px;padding:48px 24px;',
  card: 'background:linear-gradient(135deg,#141414,#1A1A1A);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;',
  h1: 'color:#FFFFFF;font-size:22px;font-weight:700;line-height:1.3;margin:0 0 8px 0;letter-spacing:-0.02em;',
  h2: 'color:#A0A0A0;font-size:14px;font-weight:500;margin:0 0 24px 0;letter-spacing:0.3px;',
  p: 'color:#909090;font-size:15px;line-height:1.7;margin:0 0 20px 0;',
  pSmall: 'color:#707070;font-size:13px;line-height:1.6;margin:0 0 16px 0;',
  label: 'color:#707070;font-size:12px;font-weight:500;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.5px;',
  value: 'color:#FFFFFF;font-size:20px;font-weight:600;margin:0 0 20px 0;letter-spacing:-0.01em;',
  valueLarge: 'color:#00D4AA;font-size:32px;font-weight:700;margin:0 0 0 0;letter-spacing:-0.02em;',
  accent: 'color:#00D4AA;text-decoration:none;',
  btn: 'display:inline-block;padding:14px 36px;background:#00D4AA;color:#0A0A0A;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:0.01em;',
  btnBorder: 'display:inline-block;padding:13px 35px;border:1px solid rgba(255,255,255,0.15);color:#D0D0D0;text-decoration:none;border-radius:12px;font-size:15px;font-weight:500;',
  divider: 'height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);border:0;margin:32px 0;',
  footerLink: 'color:#00D4AA;text-decoration:none;font-weight:500;',
};

function header() {
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <img src="https://sendquote.in/logo-white.svg" alt="SendQuote" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:12px;" />
            </td>
          </tr>
          <tr>
            <td align="center">
              <span style="color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:-0.5px;">SendQuote</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function footer() {
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:32px;">
    <tr><td><hr style="${S.divider}" /></td></tr>
    <tr>
      <td align="center" style="padding:16px 0 0 0;">
        <span style="color:#606060;font-size:13px;line-height:1.8;">
          SendQuote · AI-Powered Quoting Platform<br/>
          <a href="https://sendquote.in" style="${S.footerLink}">sendquote.in</a>
          &nbsp;·&nbsp; <a href="mailto:support@sendquote.in" style="${S.footerLink}">support@sendquote.in</a><br/>
          <span style="color:#505050;font-size:12px;">© ${new Date().getFullYear()} SendQuote. All rights reserved.</span>
        </span>
      </td>
    </tr>
  </table>`;
}

function btnPrimary(href: string, text: string) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px 0;">
    <tr>
      <td align="center">
        <a href="${href}" style="${S.btn}">${text}</a>
      </td>
    </tr>
  </table>`;
}

function btnSecondary(href: string, text: string) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0 0;">
    <tr>
      <td align="center">
        <a href="${href}" style="${S.btnBorder}">${text}</a>
      </td>
    </tr>
  </table>`;
}

export function wrapEmail(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>SendQuote</title></head>
<body style="${S.body}">
  <table cellpadding="0" cellspacing="0" border="0" style="${S.outerTable}">
    <tr><td align="center" style="padding:48px 24px;">
      <table cellpadding="0" cellspacing="0" border="0" style="${S.container}">
        ${header()}
        <tr><td style="${S.card}">${content}</td></tr>
        ${footer()}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function quoteReceivedEmail(quoteNumber: string, businessName: string, total: string, _currency: string, quoteUrl: string) {
  return `
    <h1 style="${S.h1}">You have a new quote</h1>
    <p style="${S.h2}">from ${businessName}</p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:rgba(255,255,255,0.03);border-radius:12px;padding:24px;margin:24px 0;">
      <tr>
        <td style="padding-bottom:16px;">
          <p style="${S.label}">Quote</p>
          <p style="${S.value}">${quoteNumber}</p>
        </td>
      </tr>
      <tr>
        <td>
          <p style="${S.label}">Amount</p>
          <p style="${S.valueLarge}">₹${total}</p>
        </td>
      </tr>
    </table>
    ${btnPrimary(quoteUrl, "View & Respond to Quote")}
    <p style="${S.pSmall}margin-top:20px;">Review the details, sign electronically, and pay — all in one place. No account required.</p>
  `;
}

export function quoteAcceptedEmail(quoteNumber: string, clientName: string, total: string, _currency: string, dashboardUrl: string) {
  return `
    <h1 style="${S.h1}">Deal closed 🎉</h1>
    <p style="${S.h2}">${clientName} accepted ${quoteNumber}</p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg,rgba(0,212,170,0.08),rgba(0,212,170,0.03));border:1px solid rgba(0,212,170,0.15);border-radius:12px;padding:24px;margin:24px 0;">
      <tr>
        <td align="center">
          <p style="${S.label}text-align:center;">Deal value</p>
          <p style="${S.valueLarge}text-align:center;">₹${total}</p>
        </td>
      </tr>
    </table>
    ${btnPrimary(dashboardUrl, "View in Dashboard")}
    <p style="${S.pSmall}">The invoice has been generated. Check your dashboard for next steps.</p>
  `;
}

export function teamInviteEmail(inviterName: string, organizationName: string, inviteUrl: string) {
  return `
    <h1 style="${S.h1}">You're invited</h1>
    <p style="${S.h2}">Join ${organizationName} on SendQuote</p>
    <p style="${S.p}"><strong style="color:#E0E0E0;">${inviterName}</strong> has invited you to collaborate on quotes, manage clients, and track deals with their team.</p>
    ${btnPrimary(inviteUrl, "Accept Invitation")}
    <p style="${S.pSmall}">This invitation expires in 7 days. If you weren't expecting this, you can safely ignore it.</p>
  `;
}

export function passwordResetEmail(resetUrl: string) {
  return `
    <h1 style="${S.h1}">Reset your password</h1>
    <p style="${S.h2}">We received your request</p>
    <p style="${S.p}">Click the button below to set a new password for your SendQuote account.</p>
    ${btnPrimary(resetUrl, "Reset Password")}
    <p style="${S.pSmall}">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
  `;
}

export function signupWelcomeEmail(name: string, dashboardUrl: string) {
  return `
    <h1 style="${S.h1}">Welcome${name ? `, ${name}` : ''}</h1>
    <p style="${S.h2}">Your SendQuote account is ready</p>
    <p style="${S.p}">Create professional GST-ready quotes in 60 seconds, send interactive deal rooms, and collect e-signatures — all in one place.</p>
    ${btnPrimary(dashboardUrl, "Go to Dashboard")}
    ${btnSecondary("https://sendquote.in/docs", "Read the Guide")}
  `;
}
