export interface ContractData {
  quoteNumber: string;
  clientName: string;
  clientEmail: string | null;
  businessName: string;
  items: { description: string; quantity: number; rate: number; amount: number }[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  signatoryName: string;
  signedAt: string;
  validUntil: string | null;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export function generateContractHtml(data: ContractData): string {
  const itemsRows = data.items.map((item) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#0f172a;">${escapeHtml(item.description)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px;color:#64748b;">${item.quantity}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;color:#0f172a;">₹${item.rate.toLocaleString("en-IN")}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;color:#0f172a;font-weight:600;">₹${item.amount.toLocaleString("en-IN")}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Contract · ${escapeHtml(data.quoteNumber)} · SendQuote</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);">
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <h1 style="margin:0 0 4px 0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Contract Agreement</h1>
                  <p style="margin:0;color:#94a3b8;font-size:13px;">${escapeHtml(data.quoteNumber)} · ${new Date(data.signedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
                </td>
                <td align="right" valign="top">
                  <img src="https://sendquote.in/logo-v2.svg" alt="SendQuote" width="40" height="40" style="border-radius:10px;opacity:0.9;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:32px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding-bottom:24px;">
                <p style="margin:0 0 4px 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Client</p>
                <p style="margin:0;font-size:15px;color:#0f172a;font-weight:600;">${escapeHtml(data.clientName)}</p>
                ${data.clientEmail ? `<p style="margin:2px 0 0 0;font-size:13px;color:#64748b;">${escapeHtml(data.clientEmail)}</p>` : ""}
              </td>
              <td width="50%" style="padding-bottom:24px;">
                <p style="margin:0 0 4px 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Provider</p>
                <p style="margin:0;font-size:15px;color:#0f172a;font-weight:600;">${escapeHtml(data.businessName)}</p>
                <p style="margin:2px 0 0 0;font-size:13px;color:#64748b;">via SendQuote</p>
              </td>
            </tr>
          </table>
          <h2 style="margin:0 0 16px 0;font-size:15px;color:#0f172a;font-weight:600;">Services</h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            <thead>
              <tr>
                <th style="padding:8px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #f1f5f9;">Description</th>
                <th style="padding:8px;text-align:center;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #f1f5f9;">Qty</th>
                <th style="padding:8px;text-align:right;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #f1f5f9;">Rate</th>
                <th style="padding:8px;text-align:right;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #f1f5f9;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemsRows}</tbody>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
            <tr><td style="padding:8px;text-align:right;font-size:14px;color:#64748b;">Subtotal</td><td style="padding:8px;text-align:right;font-size:14px;color:#0f172a;width:120px;">₹${data.subtotal.toLocaleString("en-IN")}</td></tr>
            ${data.gstRate > 0 ? `<tr><td style="padding:8px;text-align:right;font-size:14px;color:#64748b;">GST (${data.gstRate}%)</td><td style="padding:8px;text-align:right;font-size:14px;color:#0f172a;">₹${data.gstAmount.toLocaleString("en-IN")}</td></tr>` : ""}
            <tr><td style="padding:12px 8px;text-align:right;font-size:18px;color:#0f172a;font-weight:700;border-top:2px solid #0f172a;">Total</td><td style="padding:12px 8px;text-align:right;font-size:18px;color:#0f172a;font-weight:700;border-top:2px solid #0f172a;">₹${data.total.toLocaleString("en-IN")}</td></tr>
          </table>
          ${data.notes ? `<h2 style="margin:24px 0 8px 0;font-size:13px;color:#0f172a;font-weight:600;">Notes</h2><p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">${escapeHtml(data.notes)}</p>` : ""}
          ${data.terms ? `<h2 style="margin:24px 0 8px 0;font-size:13px;color:#0f172a;font-weight:600;">Terms</h2><p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">${escapeHtml(data.terms)}</p>` : ""}
        </td></tr>
        <tr><td style="border-top:1px solid #f1f5f9;padding:24px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="top" width="50%">
                <p style="margin:0 0 8px 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Signed by</p>
                <div style="font-family:'Brush Script MT',cursive,'Georgia',serif;font-size:32px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-bottom:8px;">${escapeHtml(data.signatoryName)}</div>
                <p style="margin:0;font-size:13px;color:#64748b;">${escapeHtml(data.signatoryName)}</p>
                <p style="margin:0;font-size:13px;color:#64748b;">${new Date(data.signedAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}</p>
              </td>
              <td valign="top" width="50%" align="right">
                <p style="margin:0 0 8px 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Validity</p>
                <p style="margin:0 0 4px 0;font-size:13px;color:#0f172a;">${data.validUntil ? `Valid until ${new Date(data.validUntil).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}` : "No expiry"}</p>
                <p style="margin:0;font-size:11px;color:#94a3b8;">Contract ID: ${escapeHtml(data.quoteNumber)}</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Powered by <a href="https://sendquote.in" style="color:#00D4AA;text-decoration:none;font-weight:500;">SendQuote</a> · AI-Powered Quoting Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
