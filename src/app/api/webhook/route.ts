import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { logger } from '@/lib/logger'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
}

const SUPABASE_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

async function supabasePatch(table: string, filter: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: SUPABASE_HEADERS,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text()
    logger.error('Supabase PATCH failed', { table, status: res.status, error: errText })
    throw new Error(`Supabase error: ${res.status}`)
  }
}

async function supabaseGet(table: string, filter: string, select = '*') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=${select}`, {
    headers: SUPABASE_HEADERS,
  })
  if (!res.ok) {
    logger.error('Supabase GET failed', { table, status: res.status })
    return []
  }
  return res.json()
}

async function supabasePost(table: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text()
    logger.error('Supabase POST failed', { table, status: res.status, error: errText })
    throw new Error(`Supabase error: ${res.status}`)
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'webhook secret not configured' }, { status: 500 })
  }

  const text = await request.text()

  const signature = request.headers.get('x-razorpay-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 401 })
  }

  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(text)
    .digest('hex')

  if (!safeCompare(expectedSig, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const event = body.event as string | undefined
  const razorpayEventId = (body as Record<string, unknown>).id as string | undefined

  if (!event || !razorpayEventId) {
    return NextResponse.json({ error: 'missing event or id' }, { status: 400 })
  }

  try {
    // Idempotency: check if this Razorpay event has already been processed
    const existing = await supabaseGet('webhook_events', `razorpay_event_id=eq.${razorpayEventId}&select=id`)
    if (existing && existing.length > 0) {
      logger.info('Duplicate Razorpay event skipped', { razorpayEventId, event })
      return NextResponse.json({ ok: true, duplicate: true })
    }

    if (event === 'payment.captured') {
      await handlePaymentCaptured(body)
    } else if (event === 'subscription.activated' || event === 'subscription.charged') {
      await handleSubscriptionActivated(body)
    } else if (event === 'subscription.cancelled' || event === 'subscription.expired') {
      await handleSubscriptionCancelled(body)
    }

    // Record the event as processed (idempotency marker)
    const payload = body.payload ?? null
    const userId = extractUserId(body, event)
    await supabasePost('webhook_events', {
      razorpay_event_id: razorpayEventId,
      event_type: event,
      user_id: userId,
      payload,
    })

    logger.info('Webhook event processed', { event, razorpayEventId })
  } catch (err) {
    logger.error('Webhook processing failed', { event, error: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ error: 'processing failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

function extractUserId(body: Record<string, unknown>, event: string): string | null {
  const payload = body.payload as Record<string, unknown> | undefined
  if (event === 'payment.captured') {
    const payment = payload?.payment as Record<string, unknown> | undefined
    const entity = payment?.entity as Record<string, unknown> | undefined
    return (entity?.notes as Record<string, unknown> | undefined)?.user_id as string | null
  }
  if (event.startsWith('subscription.')) {
    const subscription = payload?.subscription as Record<string, unknown> | undefined
    const entity = subscription?.entity as Record<string, unknown> | undefined
    return (entity?.notes as Record<string, unknown> | undefined)?.user_id as string | null
  }
  return null
}

async function handlePaymentCaptured(body: Record<string, unknown>) {
  const payload = body.payload as Record<string, unknown> | undefined
  const payment = payload?.payment as Record<string, unknown> | undefined
  const entity = payment?.entity as Record<string, unknown> | undefined
  if (!entity) return

  const subscriptions = await supabaseGet('subscriptions', `razorpay_payment_id=eq.${entity.id}&select=user_id,plan_type,billing_cycle`)
  if (!subscriptions || subscriptions.length === 0) return

  const sub = subscriptions[0] as Record<string, unknown>
  const billingCycle = (sub.billing_cycle as string) || 'monthly'
  const months = billingCycle === 'annual' ? 12 : 1
  const periodEnd = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)

  await supabasePatch('profiles', `user_id=eq.${sub.user_id}`, {
    plan: ((sub.plan_type as string) || 'starter').replace(/_monthly$|_annual$/, ''),
    plan_expiry: periodEnd.toISOString(),
  })

  await supabasePatch('subscriptions', `razorpay_payment_id=eq.${entity.id}`, {
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: periodEnd.toISOString(),
  })
}

async function handleSubscriptionActivated(body: Record<string, unknown>) {
  const payload = body.payload as Record<string, unknown> | undefined
  const sub = payload?.subscription as Record<string, unknown> | undefined
  const entity = sub?.entity as Record<string, unknown> | undefined
  if (!entity) return

  const existing = await supabaseGet('subscriptions', `razorpay_subscription_id=eq.${entity.id}&select=user_id,plan_type,billing_cycle`)
  if (!existing || existing.length === 0) return

  const existingSub = existing[0] as Record<string, unknown>
  const userId = existingSub.user_id as string
  const billingCycle = (existingSub.billing_cycle as string) || 'monthly'
  const months = billingCycle === 'annual' ? 12 : 1
  const periodEnd = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)

  const paymentEntity = (payload?.payment as Record<string, unknown> | undefined)?.entity as Record<string, unknown> | undefined
  await supabasePatch('subscriptions', `razorpay_subscription_id=eq.${entity.id}`, {
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: periodEnd.toISOString(),
    razorpay_payment_id: entity.paid_at ? (paymentEntity?.id as string | null) : null,
  })

  const planName = ((existingSub.plan_type as string) || 'starter').replace(/_monthly$|_annual$/, '')
  await supabasePatch('profiles', `user_id=eq.${userId}`, {
    plan: planName,
    plan_expiry: periodEnd.toISOString(),
  })

  await processReferralConversion(userId)
}

async function handleSubscriptionCancelled(body: Record<string, unknown>) {
  const payload = body.payload as Record<string, unknown> | undefined
  const sub = payload?.subscription as Record<string, unknown> | undefined
  const entity = sub?.entity as Record<string, unknown> | undefined
  if (!entity) return

  const existing = await supabaseGet('subscriptions', `razorpay_subscription_id=eq.${entity.id}&select=user_id`)
  if (!existing || existing.length === 0) return

  const userId = existing[0].user_id as string
  const event = body.event as string

  await supabasePatch('subscriptions', `razorpay_subscription_id=eq.${entity.id}`, {
    status: event === 'subscription.expired' ? 'expired' : 'cancelled',
  })

  await supabasePatch('profiles', `user_id=eq.${userId}`, {
    plan: 'free',
    plan_expiry: null,
  })
}

async function processReferralConversion(userId: string) {
  const referredData = await supabaseGet('profiles', `user_id=eq.${userId}&select=referred_by`)
  if (!referredData || referredData.length === 0 || !referredData[0].referred_by) return

  const referrerId = referredData[0].referred_by as string

  await supabasePatch('referrals', `referred_id=eq.${userId}&status=eq.pending`, {
    status: 'converted',
  })

  const referrerProfile = await supabaseGet('profiles', `user_id=eq.${referrerId}&select=plan_expiry`)
  if (!referrerProfile || referrerProfile.length === 0 || !referrerProfile[0].plan_expiry) return

  const currentExpiry = new Date(referrerProfile[0].plan_expiry as string)
  const extendedExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000)
  await supabasePatch('profiles', `user_id=eq.${referrerId}`, {
    plan_expiry: extendedExpiry.toISOString(),
  })
}
