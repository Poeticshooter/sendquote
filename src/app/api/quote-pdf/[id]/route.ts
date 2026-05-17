import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { generateQuotePDF } from '@/lib/pdf'
import { getUser } from '@/lib/auth'
import { logger } from '@/lib/logger'

type QuoteItem = { description: string; spec?: string; quantity: number; unit: string; rate: number; amount: number }

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    const { data: quote, error: qErr } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single()

    if (qErr || !quote) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    if (quote.user_id !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, logo_url, phone, gst_number, address, plan')
      .eq('user_id', quote.user_id)
      .single()

    const { data: items } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', id)
      .order('sort_order')

    const pdfBytes = await generateQuotePDF({
      businessName: profile?.business_name || 'Your Business',
      logoUrl: profile?.logo_url || undefined,
      phone: profile?.phone || '',
      gstNumber: profile?.gst_number || '',
      address: profile?.address || '',
      quoteNumber: quote.quote_number,
      date: new Date(quote.created_at).toLocaleDateString('en-IN'),
      validTill: quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('en-IN') : 'N/A',
      status: quote.status,
      clientName: quote.client_name,
      clientAddress: quote.client_address || '',
      clientPhone: quote.client_phone || '',
      clientEmail: quote.client_email || '',
      items: (items || []).map((i: QuoteItem) => ({
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
      isFreePlan: profile?.plan === 'free',
    })

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quote-${quote.quote_number}.pdf"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    logger.error('Quote PDF error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
