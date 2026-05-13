import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { url, events, secret } = await request.json()

    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Valid webhook URL required' }, { status: 400 })
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'At least one event required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Store webhook configuration
    const { data: webhook, error } = await supabase.from('webhooks').insert({
      user_id: user.id,
      url,
      events,
      secret: secret || null,
      active: true
    }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Test the webhook
    try {
      const testResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SendQuote-Webhook': 'test'
        },
        body: JSON.stringify({
          event: 'test',
          data: { message: 'Webhook configured successfully' },
          timestamp: new Date().toISOString()
        })
      })
    } catch (e) {
      // Webhook might not be reachable but still save it
    }

    return NextResponse.json({ success: true, webhook })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ webhooks: webhooks || [] })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabase.from('webhooks').delete().eq('id', id).eq('user_id', user.id)

  return NextResponse.json({ success: true })
}