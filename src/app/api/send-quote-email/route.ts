import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { generateQuotePDF } from '@/lib/pdf'
import { sanitizeInput } from '@/lib/sanitize'
import { rateLimit } from '@/lib/rate-limit'
import { getUser } from '@/lib/auth'
import { validate, sendQuoteEmailSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'
import { csrfProtected } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const limit = await rateLimit(ip, 'send-quote-email', 10, 60 * 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter: limit.retryAfter }, {
      status: 429,
      headers: { 'Retry-After': String(limit.retryAfter) },
    })
  }

  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const csrf = csrfProtected(request)
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.message }, { status: csrf.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data, error } = validate(sendQuoteEmailSchema, body)
  if (error || !data) {
    return NextResponse.json({ error: error || 'Invalid input' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: quote, error: qErr } = await supabase.rpc('get_quote_admin', { p_id: data.quoteId })
  if (qErr || !quote || !quote.id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  if (quote.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!quote.client_email) return NextResponse.json({ error: 'No client email' }, { status: 400 })

  const { data: profile } = await supabase.rpc('get_profile_admin', { p_user_id: quote.user_id })
  const { data: itemsRaw } = await supabase.rpc('get_quote_items', { p_quote_id: data.quoteId })
  let items: Array<{ description: string; spec?: string; quantity: number; unit: string; rate: number; amount: number }> = []
  if (Array.isArray(itemsRaw)) {
    items = itemsRaw
  } else if (typeof itemsRaw === 'string') {
    try {
      items = JSON.parse(itemsRaw)
    } catch {
      items = []
    }
  }

  const businessName = profile?.business_name || 'Your Business'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sendquote.in'

  const pdfBytes = await generateQuotePDF({
    businessName,
    logoUrl: profile?.logo_url || undefined,
    quoteNumber: quote.quote_number,
    date: new Date(quote.created_at).toLocaleDateString('en-IN'),
    validTill: quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('en-IN') : 'N/A',
    status: quote.status,
    clientName: quote.client_name,
    clientAddress: quote.client_address || '',
    clientPhone: quote.client_phone || '',
    clientEmail: quote.client_email,
    items: items.map((i) => ({
      description: i.description,
      spec: i.spec || '',
      quantity: i.quantity,
      unit: i.unit,
      rate: i.rate,
      amount: i.amount,
    })),
    subtotal: Number(quote.subtotal),
    discount: Number(quote.discount),
    discountType: quote.discount_type,
    gstRate: Number(quote.gst_rate),
    gstAmount: Number(quote.gst_amount),
    total: Number(quote.total),
    terms: quote.terms || '',
    notes: quote.notes || '',
    paymentTerms: quote.payment_terms || '',
  })

  const pdfBuffer = Buffer.from(pdfBytes)

  try {
    const { sendEmail } = await import('@/lib/email')
    const quoteLink = `${siteUrl}/q/${quote.unique_token}`
    const itemsHtml = items.length > 0 ? `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
        <tr style="background-color:#f8fafc;">
          <th style="padding:12px 16px; text-align:left; font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em;">Item</th>
          <th style="padding:12px 16px; text-align:center; font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em;">Qty</th>
          <th style="padding:12px 16px; text-align:right; font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em;">Rate</th>
          <th style="padding:12px 16px; text-align:right; font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em;">Amount</th>
        </tr>
        ${items.map((item, idx) => `
        <tr style="background-color:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding:12px 16px; font-size:14px; color:#0f172a;">${escapeHtml(item.description)}</td>
          <td style="padding:12px 16px; font-size:14px; color:#0f172a; text-align:center;">${item.quantity} ${item.unit}</td>
          <td style="padding:12px 16px; font-size:14px; color:#0f172a; text-align:right;">₹${Number(item.rate).toLocaleString('en-IN')}</td>
          <td style="padding:12px 16px; font-size:14px; font-weight:600; color:#0f172a; text-align:right;">₹${Number(item.amount).toLocaleString('en-IN')}</td>
        </tr>
        `).join('')}
      </table>
    ` : ''

    const totalsHtml = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">
        <tr>
          <td style="padding:8px 0; font-size:14px; color:#64748b;">Subtotal</td>
          <td style="padding:8px 0; font-size:14px; color:#0f172a; text-align:right;">₹${Number(quote.subtotal).toLocaleString('en-IN')}</td>
        </tr>
        ${Number(quote.gst_amount) > 0 ? `
        <tr>
          <td style="padding:8px 0; font-size:14px; color:#64748b;">GST (${Number(quote.gst_rate)}%)</td>
          <td style="padding:8px 0; font-size:14px; color:#0f172a; text-align:right;">₹${Number(quote.gst_amount).toLocaleString('en-IN')}</td>
        </tr>
        ` : ''}
        <tr style="border-top:2px solid #e2e8f0;">
          <td style="padding:12px 0 0 0; font-size:16px; font-weight:700; color:#0f172a;">Total</td>
          <td style="padding:12px 0 0 0; font-size:16px; font-weight:700; color:#4f46e5; text-align:right;">₹${Number(quote.total).toLocaleString('en-IN')}</td>
        </tr>
      </table>
    `

    const emailHtml = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-bottom:8px;">
            <span style="display:inline-block; width:48px; height:48px; background-color:#eef2ff; border-radius:12px; text-align:center; line-height:48px; font-size:24px;">📄</span>
          </td>
        </tr>
        <tr>
          <td>
            <h1 style="margin:0 0 8px 0; font-size:22px; font-weight:700; color:#0f172a;">Quote #${escapeHtml(quote.quote_number)}</h1>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0 0 16px 0; color:#64748b; font-size:15px; line-height:1.6;">
              Dear <strong style="color:#0f172a;">${escapeHtml(quote.client_name)}</strong>,
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0 0 16px 0; color:#64748b; font-size:15px; line-height:1.6;">
              Please find your quote from <strong style="color:#0f172a;">${escapeHtml(businessName)}</strong> below.
            </p>
          </td>
        </tr>
        ${itemsHtml}
        ${totalsHtml}
        ${quote.notes ? `
        <tr>
          <td>
            <p style="margin:16px 0 0 0; font-size:14px; color:#64748b; line-height:1.6;">
              <strong style="color:#0f172a;">Notes:</strong> ${escapeHtml(quote.notes)}
            </p>
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding-top:24px;">
            <a href="${quoteLink}" class="btn" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600; font-size:14px;">View Quote Online</a>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:16px 0 0 0; color:#64748b; font-size:14px; line-height:1.6;">
              If you have any questions, please feel free to reach out.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:8px 0 0 0; color:#0f172a; font-size:14px;">
              Thanks,<br/><strong>${escapeHtml(businessName)}</strong>
            </p>
          </td>
        </tr>
      </table>
    `

    function escapeHtml(text: string): string {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    }

    await sendEmail({}, quote.client_email, `Quote #${quote.quote_number} from ${businessName}`, emailHtml)
  } catch (e) {
    logger.error('Send quote email failed', {
      quoteId: data.quoteId,
      error: e instanceof Error ? e.message : 'unknown',
    })
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  if (quote.status === 'draft') {
    await supabase.rpc('record_quote_action', { p_token: quote.unique_token, p_action: 'sent', p_notes: '' })
    const { logActivity } = await import('@/lib/activity')
    await logActivity(user.id, 'quote', quote.id, 'quote_sent', { client_email: quote.client_email })
  }

  return NextResponse.json({ ok: true })
}
