import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { generateQuotePDF } from '@/lib/pdf'

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

    // Get quote directly
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

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, logo_url, phone, gst_number, address')
      .eq('user_id', quote.user_id)
      .single()

    // Get items
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
      validTill: quote.valid_till ? new Date(quote.valid_till).toLocaleDateString('en-IN') : 'N/A',
      status: quote.status,
      clientName: quote.client_name,
      clientAddress: quote.client_address || '',
      clientPhone: quote.client_phone || '',
      clientEmail: quote.client_email || '',
      items: (items || []).map((i: any) => ({
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

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quote-${quote.quote_number}.pdf"`,
      },
    })
  } catch (err: any) {
    console.error('PDF error:', err.message, err.stack)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}