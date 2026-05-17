import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import { getUser } from '@/lib/auth'
import { csrfProtected } from '@/lib/csrf'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const csrf = csrfProtected(request)
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.message }, { status: csrf.status })
  }

  const { quoteId } = await request.json()
  if (!quoteId) return NextResponse.json({ error: 'missing quoteId' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: original, error: qErr } = await supabase
    .from('quotes')
    .select('id, user_id, quote_number, client_name, client_email, client_phone, client_address, valid_until, status, subtotal, discount, discount_type, gst_rate, gst_amount, total, notes, terms, payment_terms, version')
    .eq('id', quoteId)
    .single()

  if (qErr || !original) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  if (original.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data: items } = await supabase
    .from('quote_items')
    .select('description, spec, quantity, unit, rate, amount, sort_order')
    .eq('quote_id', quoteId)
    .order('sort_order')

  const quoteNumber = await supabase.rpc('next_quote_number', { p_user_id: user.id })

  const { data: newQuote, error: insertErr } = await supabase
    .from('quotes')
    .insert({
      user_id: user.id,
      quote_number: quoteNumber,
      unique_token: nanoid(12),
      client_name: original.client_name,
      client_email: original.client_email,
      client_phone: original.client_phone,
      client_address: original.client_address,
      valid_until: original.valid_until,
      status: 'draft',
      subtotal: original.subtotal,
      discount: original.discount,
      discount_type: original.discount_type,
      gst_rate: original.gst_rate,
      gst_amount: original.gst_amount,
      total: original.total,
      notes: original.notes,
      terms: original.terms,
      payment_terms: original.payment_terms,
      parent_quote_id: original.id,
      version: (original.version || 1) + 1,
    })
    .select('id')
    .single()

  if (insertErr || !newQuote) {
    logger.error('Failed to duplicate quote', { userId: user.id, quoteId })
    return NextResponse.json({ error: 'failed to create duplicate' }, { status: 500 })
  }

  if (items && items.length > 0) {
    const newItems = items.map((item: { description: string; spec?: string; quantity: number; unit: string; rate: number; amount: number }, index: number) => ({
      quote_id: newQuote.id,
      description: item.description,
      spec: item.spec || '',
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      amount: item.amount,
      sort_order: index,
    }))

    const { error: itemsErr } = await supabase.from('quote_items').insert(newItems)
    if (itemsErr) {
      return NextResponse.json({ error: 'failed to copy items' }, { status: 500 })
    }
  }

  logger.info('Quote duplicated', { userId: user.id, quoteId, newQuoteId: newQuote.id })
  return NextResponse.json({ quoteId: newQuote.id, quoteNumber })
}
