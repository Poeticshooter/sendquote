import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return new NextResponse('', { status: 204 })
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const limit = await rateLimit(ip, `track-${token}`, 100, 60 * 1000)
  if (!limit.allowed) {
    return new NextResponse('', { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } })
  }

  const supabase = createAdminClient()
  
  // Get quote
  const { data: quote } = await supabase
    .from('quotes')
    .select('id, user_id, status')
    .eq('unique_token', token)
    .single()

  if (quote) {
    // Record event
    await supabase
      .from('quote_events')
      .insert({
        quote_id: quote.id,
        event_type: 'opened',
        device_type: 'unknown'
      })

    // Log activity
    const { logActivity } = await import('@/lib/activity')
    await logActivity(quote.user_id, 'quote', quote.id, 'quote_opened', { ip, from: 'track' })

    // Update status if was 'sent'
    if (quote.status === 'sent') {
      await supabase
        .from('quotes')
        .update({ status: 'opened' })
        .eq('id', quote.id)
    }
  }

  // Return 1x1 transparent GIF
  return new NextResponse(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'), {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}