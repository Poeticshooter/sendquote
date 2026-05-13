import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { event, data } = await request.json()
    
    if (!event || !data) {
      return NextResponse.json({ error: 'Event and data required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    // Get user from quote/invoice
    const userId = data.user_id || data.userId
    if (!userId) {
      return NextResponse.json({ error: 'User ID required in data' }, { status: 400 })
    }

    // Fetch active webhooks for this user that listen to this event
    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .contains('events', [event])

    if (!webhooks || webhooks.length === 0) {
      return NextResponse.json({ success: true, triggered: 0 })
    }

    const results = await Promise.allSettled(
      webhooks.map(async (webhook: any) => {
        const payload = {
          event,
          data,
          timestamp: new Date().toISOString(),
          webhook_id: webhook.id
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-SendQuote-Event': event,
          'X-SendQuote-Webhook-Id': webhook.id
        }

        if (webhook.secret) {
          headers['X-SendQuote-Signature'] = webhook.secret
        }

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000)
          
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal
          })
          clearTimeout(timeoutId)
          return { webhook_id: webhook.id, status: response.status, success: response.ok }
        } catch (err: any) {
          return { webhook_id: webhook.id, error: err.message, success: false }
        }
      })
    )

    return NextResponse.json({ 
      success: true, 
      triggered: webhooks.length,
      results 
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function Timeout(seconds: number) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), seconds * 1000)
  )
}