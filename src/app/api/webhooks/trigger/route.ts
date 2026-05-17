import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
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

  let body: { event?: unknown; data?: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { event, data } = body

  if (typeof event !== 'string' || !event) {
    return NextResponse.json({ error: 'Event string required' }, { status: 400 })
  }

  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'Data object required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch active webhooks for the authenticated user that listen to this event
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .contains('events', [event])

  if (!webhooks || webhooks.length === 0) {
    return NextResponse.json({ success: true, triggered: 0 })
  }

  const results = await Promise.allSettled(
    webhooks.map(async (webhook: Record<string, unknown>) => {
      const payload = {
        event,
        data,
        timestamp: new Date().toISOString(),
        webhook_id: webhook.id
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-SendQuote-Event': event,
        'X-SendQuote-Webhook-Id': String(webhook.id)
      }

      if (typeof webhook.secret === 'string' && webhook.secret) {
        headers['X-SendQuote-Signature'] = webhook.secret
      }

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(String(webhook.url), {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        return { webhook_id: webhook.id, status: response.status, success: response.ok }
      } catch (err: unknown) {
        return { webhook_id: webhook.id, error: err instanceof Error ? err.message : 'Unknown error', success: false }
      }
    })
  )

  return NextResponse.json({
    success: true,
    triggered: webhooks.length,
    results
  })
}
