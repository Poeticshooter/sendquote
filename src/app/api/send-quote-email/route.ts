import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { generateQuotePDF } from '@/lib/pdf'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.EMAIL_FROM_ADDRESS || 'quotes@resend.dev'

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabase = createAdminClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!error && user) return user
  }
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { quoteId } = await request.json()
  if (!quoteId) return NextResponse.json({ error: 'missing quoteId' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: quote, error: qErr } = await supabase.rpc('get_quote_admin', { p_id: quoteId })
  if (qErr || !quote || !quote.id) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (quote.user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!quote.client_email) return NextResponse.json({ error: 'no client email' }, { status: 400 })

  const { data: profile } = await supabase.rpc('get_profile_admin', { p_user_id: quote.user_id })
  const { data: itemsRaw } = await supabase.rpc('get_quote_items', { p_quote_id: quoteId })
  const items = Array.isArray(itemsRaw) ? itemsRaw : (typeof itemsRaw === 'string' ? JSON.parse(itemsRaw) : [])

  const businessName = profile?.business_name || 'Your Business'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sendquote.in'

  const pdfBytes = await generateQuotePDF({
    businessName,
    logoUrl: profile?.logo_url || undefined,
    quoteNumber: quote.quote_number,
    date: new Date(quote.created_at).toLocaleDateString('en-IN'),
    validTill: quote.valid_till ? new Date(quote.valid_till).toLocaleDateString('en-IN') : 'N/A',
    status: quote.status,
    clientName: quote.client_name,
    clientAddress: quote.client_address || '',
    clientPhone: quote.client_phone || '',
    clientEmail: quote.client_email,
items: items.map((i: any) => ({
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
    if (resend) {
      await resend.emails.send({
        from: FROM,
        to: quote.client_email,
        subject: `Quote #${quote.quote_number} from ${businessName}`,
        html: `<p>Dear ${quote.client_name},</p>
<p>Please find your quote <strong>#${quote.quote_number}</strong> attached.</p>
<p>You can also view it online: <a href="${siteUrl}/q/${quote.unique_token}">View Quote Online</a></p>
<p>If you have any questions, please feel free to reach out.</p>
<p>Thanks,<br/>${businessName}</p>`,
        attachments: [{
          filename: `quote-${quote.quote_number}.pdf`,
          content: pdfBuffer.toString('base64'),
        }],
      })
    }
  } catch (e) {
    console.error('Send email error:', e)
    return NextResponse.json({ error: 'email failed' }, { status: 500 })
  }

  if (quote.status === 'draft') {
    await supabase.rpc('record_quote_action', { p_token: quote.unique_token, p_action: 'sent', p_notes: '' })
  }

  return NextResponse.json({ ok: true })
}