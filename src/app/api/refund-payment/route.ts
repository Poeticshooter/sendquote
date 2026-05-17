import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getUser } from '@/lib/auth'
import { csrfProtected } from '@/lib/csrf'
import { logger } from '@/lib/logger'

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const csrf = csrfProtected(request)
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.message }, { status: csrf.status })
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 })
  }

  let body: { paymentId?: unknown; amount?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const paymentId = typeof body.paymentId === 'string' ? body.paymentId : null
  const amount = typeof body.amount === 'number' ? body.amount : null

  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify the payment belongs to this user
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, razorpay_payment_id, status, plan_type, user_id')
    .eq('user_id', user.id)
    .eq('razorpay_payment_id', paymentId)
    .single()

  if (!subscription) {
    return NextResponse.json({ error: 'Payment not found or does not belong to you' }, { status: 404 })
  }

  // Initiate refund via Razorpay
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
  const refundBody: Record<string, unknown> = { payment_id: paymentId }
  if (amount) refundBody.amount = amount * 100 // Convert to paise

  const res = await fetch('https://api.razorpay.com/v1/refunds', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(refundBody),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    logger.error('Razorpay refund failed', {
      userId: user.id,
      paymentId,
      razorpayError: error,
    })
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 })
  }

  const refundData = await res.json()
  const refundId = refundData.id as string

  // Update local state: cancel subscription, downgrade to free
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      refund_id: refundId,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', subscription.id)

  await supabase
    .from('profiles')
    .update({
      plan: 'free',
      plan_expiry: null,
    })
    .eq('user_id', user.id)

  logger.info('Refund processed, subscription cancelled', {
    userId: user.id,
    subscriptionId: subscription.id,
    paymentId,
    refundId,
    amount: amount || 'full',
  })

  return NextResponse.json({
    ok: true,
    refundId,
    message: 'Refund initiated. Your subscription has been cancelled.',
  })
}
