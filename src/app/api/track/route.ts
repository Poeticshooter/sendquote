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
  
  const { data: quote } = await supabase
    .from('quotes')
    .select('id, user_id, status, client_name, quote_number, client_email')
    .eq('unique_token', token)
    .single()

  if (quote) {
    const { data: existingOpen } = await supabase
      .from('quote_events')
      .select('id')
      .eq('quote_id', quote.id)
      .eq('event_type', 'opened')
      .order('created_at', { ascending: false })
      .limit(1)

    const isFirstOpen = !existingOpen || existingOpen.length === 0

    await supabase
      .from('quote_events')
      .insert({
        quote_id: quote.id,
        event_type: 'opened',
        device_type: 'unknown'
      })

    const { logActivity } = await import('@/lib/activity')
    await logActivity(quote.user_id, 'quote', quote.id, 'quote_opened', { ip, from: 'track' })

    if (quote.status === 'sent') {
      await supabase
        .from('quotes')
        .update({ status: 'opened' })
        .eq('id', quote.id)
    }

    if (isFirstOpen) {
      const { data: userData } = await supabase.auth.admin.getUserById(quote.user_id)
      const userEmail = userData?.user?.email
      if (userEmail) {
        try {
          const { sendEmail } = await import('@/lib/email')
          await sendEmail(
            {},
            userEmail,
            `Quote #${quote.quote_number} opened by ${quote.client_name}`,
            `<p>Hi there,</p>
<p><strong>${quote.client_name}</strong> has opened your quote <strong>#${quote.quote_number}</strong>.</p>
<p>They're reviewing it now. You'll be notified if they accept or request changes.</p>`
          )
        } catch {
          // Email notification failure is non-critical
        }
      }
    }
  }

  return new NextResponse(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'), {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}