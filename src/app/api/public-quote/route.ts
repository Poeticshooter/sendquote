import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const limit = await rateLimit(ip, 'public-quote', 60, 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter: limit.retryAfter }, {
      status: 429,
      headers: { 'Retry-After': String(limit.retryAfter) },
    })
  }

  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'missing token' }, { status: 400 })
  }

  const supabase = createAdminClient()
  
  // Get quote directly without RPC
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('unique_token', token)
    .single()

  if (quoteError || !quote) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  // Get sender profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, logo_url, phone, gst_number, address, upi_id')
    .eq('user_id', quote.user_id)
    .single()

  // Get quote items
  const { data: items } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', quote.id)
    .order('sort_order')

  return NextResponse.json({
    ...quote,
    business_name: profile?.business_name || '',
    logo_url: profile?.logo_url || '',
    phone: profile?.phone || '',
    gst_number: profile?.gst_number || '',
    address: profile?.address || '',
    upi_id: profile?.upi_id || '',
    items: items || []
  }, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'X-Frame-Options': 'DENY',
    },
  })
}