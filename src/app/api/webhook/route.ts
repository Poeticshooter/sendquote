import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const url = process.env.NEXT_PUBLIC_SUPABASE_URL

export async function POST(request: NextRequest) {
  const text = await request.text()
  const body = JSON.parse(text)
  const event = body.event

  const signature = request.headers.get('x-razorpay-signature')
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (webhookSecret && webhookSecret !== 'placeholder') {
    if (!signature) {
      return NextResponse.json({ error: 'missing signature' }, { status: 401 })
    }

    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(text)
      .digest('hex')

    if (expectedSig !== signature) {
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
    }
  }

  if (event === 'payment.captured') {
    const payment = body.payload?.payment?.entity
    if (!payment) return NextResponse.json({ error: 'invalid payload' }, { status: 400 })

    const subRes = await fetch(`${url}/rest/v1/subscriptions?razorpay_payment_id=eq.${payment.id}&select=user_id,plan_type`, {
      headers: { 'apikey': key!, 'Authorization': `Bearer ${key}` }
    })
    const subscription = await subRes.json()

    if (subscription && subscription.length > 0) {
      const sub = subscription[0]
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      await fetch(`${url}/rest/v1/profiles?user_id=eq.${sub.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': key!, 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          plan: sub.plan_type,
          plan_expiry: periodEnd.toISOString(),
        })
      })

      await fetch(`${url}/rest/v1/subscriptions?razorpay_payment_id=eq.${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': key!, 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          status: 'active',
          razorpay_payment_id: payment.id,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
      })
    }
  }

  if (event === 'subscription.activated' || event === 'subscription.charged') {
    const sub = body.payload?.subscription?.entity
    if (!sub) return NextResponse.json({ error: 'invalid payload' }, { status: 400 })

    const existingRes = await fetch(`${url}/rest/v1/subscriptions?razorpay_subscription_id=eq.${sub.id}&select=user_id`, {
      headers: { 'apikey': key!, 'Authorization': `Bearer ${key}` }
    })
    const existing = await existingRes.json()

    if (existing && existing.length > 0) {
      const userId = existing[0].user_id

      await fetch(`${url}/rest/v1/subscriptions?razorpay_subscription_id=eq.${sub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': key!, 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          status: 'active',
          current_period_start: new Date(sub.current_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_end * 1000).toISOString(),
          razorpay_payment_id: sub.paid_at ? body.payload?.payment?.entity?.id : null,
        })
      })

      const planType = existing[0].plan_type || 'starter'
      await fetch(`${url}/rest/v1/profiles?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': key!, 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          plan: planType,
          plan_expiry: new Date(sub.current_end * 1000).toISOString(),
        })
      })
    }
  }

  if (event === 'subscription.cancelled' || event === 'subscription.expired') {
    const sub = body.payload?.subscription?.entity
    if (!sub) return NextResponse.json({ error: 'invalid payload' }, { status: 400 })

    const existingRes = await fetch(`${url}/rest/v1/subscriptions?razorpay_subscription_id=eq.${sub.id}&select=user_id`, {
      headers: { 'apikey': key!, 'Authorization': `Bearer ${key}` }
    })
    const existing = await existingRes.json()

    if (existing && existing.length > 0) {
      const userId = existing[0].user_id

      await fetch(`${url}/rest/v1/subscriptions?razorpay_subscription_id=eq.${sub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': key!, 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ status: event === 'subscription.expired' ? 'expired' : 'cancelled' })
      })

      await fetch(`${url}/rest/v1/profiles?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': key!, 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ plan: 'free', plan_expiry: null })
      })
    }
  }

  console.log(`Webhook event: ${event}`, JSON.stringify(body, null, 2))
  return NextResponse.json({ ok: true })
}
