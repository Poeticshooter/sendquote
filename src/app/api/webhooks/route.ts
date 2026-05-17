import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { csrfProtected } from '@/lib/csrf'
import { logger } from '@/lib/logger'
import net from 'net'
import dns from 'dns'

const PRIVATE_RANGES = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
]

function isPrivateIP(ip: string): boolean {
  return PRIVATE_RANGES.some(pattern => pattern.test(ip))
}

async function isValidPublicUrl(urlStr: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const url = new URL(urlStr)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { valid: false, reason: 'Only HTTP/HTTPS allowed' }
    }
    const hostname = url.hostname
    if (isPrivateIP(hostname)) {
      return { valid: false, reason: 'Private IP addresses not allowed' }
    }
    const addresses = await dns.promises.lookup(hostname)
    if (isPrivateIP(addresses.address)) {
      return { valid: false, reason: 'DNS resolves to private IP' }
    }
    return { valid: true }
  } catch {
    return { valid: false, reason: 'Invalid URL format' }
  }
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return jsonError('Unauthorized', 401)
  }

  const csrf = csrfProtected(request)
  if (!csrf.ok) {
    return jsonError(csrf.message, csrf.status)
  }

  let body: { url?: unknown; events?: unknown; secret?: unknown }
  try {
    body = await request.json()
  } catch {
    return jsonError('Invalid JSON body', 400)
  }

  const { url, events, secret } = body

  if (typeof url !== 'string' || !url.startsWith('http')) {
    return jsonError('Valid webhook URL required', 400)
  }

  const urlCheck = await isValidPublicUrl(url)
  if (!urlCheck.valid) {
    return jsonError(`Invalid webhook URL: ${urlCheck.reason}`, 400)
  }

  if (!Array.isArray(events) || events.length === 0) {
    return jsonError('At least one event required', 400)
  }

  const validEvents = ['quote.sent', 'quote.opened', 'quote.accepted', 'quote.expired', 'invoice.created', 'invoice.paid', 'invoice.overdue']
  const invalidEvents = events.filter((e: unknown) => typeof e !== 'string' || !validEvents.includes(e))
  if (invalidEvents.length > 0) {
    return jsonError(`Invalid event types: ${invalidEvents.join(', ')}`, 400)
  }

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('webhooks')
    .select('id')
    .eq('user_id', user.id)
    .eq('url', url)
    .limit(1)

  if (existing && existing.length > 0) {
    return jsonError('Webhook URL already exists', 409)
  }

  const { data: webhook, error } = await supabase.from('webhooks').insert({
    user_id: user.id,
    url,
    events,
    secret: typeof secret === 'string' ? secret : null,
    active: true
  }).select().single()

  if (error) {
    return jsonError(error.message, 500)
  }

  // Fire-and-forget test ping — don't block the response
  ;(async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-SendQuote-Webhook': 'test' },
        body: JSON.stringify({ event: 'test', data: { message: 'Webhook configured' }, timestamp: new Date().toISOString() }),
        signal: controller.signal
      })
      clearTimeout(timeout)
    } catch {
      // Test failed silently — webhook is still saved
    }
  })()

  logger.info('Webhook registered', { userId: user.id, webhookId: webhook.id, url, events })
  return NextResponse.json({ success: true, webhook })
}

export async function GET(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return jsonError('Unauthorized', 401)
  }

  const supabase = createAdminClient()
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ webhooks: webhooks || [] })
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return jsonError('Unauthorized', 401)
  }

  const csrf = csrfProtected(request)
  if (!csrf.ok) {
    return jsonError(csrf.message, csrf.status)
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return jsonError('Webhook ID required', 400)
  }

  const supabase = createAdminClient()
  const { data: webhook } = await supabase
    .from('webhooks')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!webhook) {
    return jsonError('Webhook not found or access denied', 404)
  }

  const { error } = await supabase.from('webhooks').delete().eq('id', id)
  if (error) {
    return jsonError(error.message, 500)
  }

  logger.info('Webhook deleted', { userId: user.id, webhookId: id })
  return NextResponse.json({ success: true })
}
