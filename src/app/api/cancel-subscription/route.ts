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

  const supabase = createAdminClient()

  // Find the user's active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, status, razorpay_order_id, razorpay_subscription_id, plan_type, current_period_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!subscription) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
  }

  // Cancel via Razorpay if it's a Razorpay subscription
  if (subscription.razorpay_subscription_id) {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
    const res = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscription.razorpay_subscription_id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancel_at_cycle_end: true }),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      logger.error('Razorpay subscription cancellation failed', {
        userId: user.id,
        subscriptionId: subscription.id,
        razorpayError: error,
      })
      return NextResponse.json({ error: 'Failed to cancel subscription with payment provider' }, { status: 500 })
    }
  }

  // Update local state: mark as cancelled but keep access until period end
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', subscription.id)

  logger.info('Subscription cancelled by user', {
    userId: user.id,
    subscriptionId: subscription.id,
    planType: subscription.plan_type,
    accessUntil: subscription.current_period_end,
  })

  return NextResponse.json({
    ok: true,
    message: 'Subscription cancelled. Access retained until the end of your billing period.',
    accessUntil: subscription.current_period_end,
  })
}
