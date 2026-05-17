import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'
import { getUser } from '@/lib/auth'
import { validate, convertToInvoiceSchema } from '@/lib/validation'
import { csrfProtected } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const csrf = csrfProtected(request)
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.message }, { status: csrf.status })
  }

  const ip = request.headers.get('x-forwarded-for') || user.id
  const limit = await rateLimit(ip, 'convert-to-invoice', 20, 60 * 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter: limit.retryAfter }, {
      status: 429,
      headers: { 'Retry-After': String(limit.retryAfter) },
    })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data, error } = validate(convertToInvoiceSchema, body)
  if (error || !data) {
    return NextResponse.json({ error: error || 'Invalid input' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: quote } = await supabase.from("quotes").select("user_id, quote_number").eq("id", data.quoteId).single()
  if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  if (quote.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: invoiceId } = await supabase.rpc('create_invoice_from_quote', { p_quote_id: data.quoteId })
  if (!invoiceId) return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })

  const { logActivity } = await import('@/lib/activity')
  await logActivity(user.id, 'quote', data.quoteId, 'invoice_created', { invoice_id: invoiceId })
  await logActivity(user.id, 'invoice', invoiceId, 'invoice_created', { quote_number: quote.quote_number })

  return NextResponse.json({ invoiceId })
}
