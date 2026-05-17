import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getUser } from '@/lib/auth'
import { validate, createRazorpayOrderSchema, razorpayConfirmSchema } from '@/lib/validation'
import { csrfProtected } from '@/lib/csrf'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!
const GST_RATE = 18
const ANNUAL_DISCOUNT = 10

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  starter: { monthly: 299, annual: Math.round(299 * 12 * (100 - ANNUAL_DISCOUNT) / 100) },
  professional: { monthly: 799, annual: Math.round(799 * 12 * (100 - ANNUAL_DISCOUNT) / 100) },
}

function computeAmount(planType: string, billingCycle: string): number {
  const plan = planType.replace(/_monthly$|_annual$/, '')
  const prices = PLAN_PRICES[plan]
  if (!prices) return PLAN_PRICES.starter.monthly

  const base = billingCycle === 'annual' ? prices.annual : prices.monthly
  const gstAmount = Math.round((base * GST_RATE) / 100)
  return base + gstAmount
}

export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const csrf = csrfProtected(request)
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.message }, { status: csrf.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data, error } = validate(createRazorpayOrderSchema, body)
  if (error || !data) {
    return NextResponse.json({ error: error || 'Invalid input' }, { status: 400 })
  }

  const { planType, billingCycle = 'monthly', couponCode } = data
  const plan = planType.replace(/_monthly$|_annual$/, '')

  const supabase = createAdminClient()

  let discountAmount = 0
  let couponId: string | null = null
  let couponDiscountValue = 0

  if (couponCode) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('id, code, expires_at, max_uses, used_count, applies_to, billing_cycle, discount_value, discount_type')
      .eq('code', couponCode.toUpperCase())
      .eq('active', true)
      .single()

    if (coupon) {
      if (!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) {
        if (coupon.max_uses === null || coupon.used_count < coupon.max_uses) {
          if (coupon.applies_to === 'all_plans' || coupon.applies_to === plan) {
            if (coupon.billing_cycle === 'both' || coupon.billing_cycle === billingCycle) {
              const { count: existingUsage } = await supabase
                .from('coupon_usages')
                .select('*', { count: 'exact', head: true })
                .eq('coupon_id', coupon.id)
                .eq('user_id', user.id)

              if (!existingUsage || existingUsage === 0) {
                couponId = coupon.id
                couponDiscountValue = Number(coupon.discount_value)
                discountAmount = coupon.discount_type === 'percentage'
                  ? Math.round(PLAN_PRICES[plan][billingCycle === 'annual' ? 'annual' : 'monthly'] * couponDiscountValue / 100)
                  : couponDiscountValue
              }
            }
          }
        }
      }
    }
  }

  const basePrice = PLAN_PRICES[plan]?.[billingCycle === 'annual' ? 'annual' : 'monthly'] ?? PLAN_PRICES.starter.monthly
  const discountedBase = Math.max(0, basePrice - discountAmount)
  const gstAmount = Math.round((discountedBase * GST_RATE) / 100)
  const totalAmount = discountedBase + gstAmount

  if (totalAmount === 0) {
    const months = billingCycle === 'annual' ? 12 : 1
    const periodEnd = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)

    await supabase.from('subscriptions').insert({
      user_id: user.id,
      razorpay_order_id: null,
      razorpay_payment_id: 'coupon_free',
      plan_type: planType,
      billing_cycle: billingCycle,
      base_price: basePrice,
      discount_amount: discountAmount,
      gst_amount: 0,
      total_amount: 0,
      amount: 0,
      status: 'active',
      coupon_code: couponCode?.toUpperCase() || null,
      coupon_discount: discountAmount,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    })

    if (couponId) {
      await supabase.from('coupon_usages').insert({
        coupon_id: couponId,
        user_id: user.id,
        discount_applied: discountAmount,
      })
      await supabase.rpc('apply_coupon', { p_code: (couponCode || '').toUpperCase() })
    }

    const planName = planType.replace('_monthly', '').replace('_annual', '')
    await supabase
      .from('profiles')
      .update({
        plan: planName,
        plan_expiry: periodEnd.toISOString(),
        billing_cycle: billingCycle,
      })
      .eq('user_id', user.id)

    return NextResponse.json({ amount_display: 0, plan: planType, billingCycle, couponApplied: true, freeAccess: true })
  }

  logger.info('Razorpay order created via free coupon', { userId: user.id, planType, billingCycle, discountAmount })

  const auth = Buffer.from(`${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: `sub_${user.id.substring(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        planType: planType,
        billingCycle: billingCycle,
        amount: totalAmount,
        couponCode: couponCode?.toUpperCase() || null,
        discountAmount: discountAmount,
      },
    }),
  })

  const order = await res.json()

  if (!res.ok) {
    logger.error('Razorpay order creation failed', { userId: user.id, planType, error: order.error?.description })
    return NextResponse.json({ error: order.error?.description || 'Payment failed' }, { status: 400 })
  }

  await supabase.from('subscriptions').insert({
    user_id: user.id,
    razorpay_order_id: order.id,
    plan_type: planType,
    billing_cycle: billingCycle,
    base_price: basePrice,
    discount_amount: discountAmount,
    gst_amount: gstAmount,
    total_amount: totalAmount,
    amount: totalAmount,
    status: 'inactive',
    coupon_code: couponCode?.toUpperCase() || null,
    coupon_discount: discountAmount,
  })

  logger.info('Razorpay order created', { userId: user.id, planType, billingCycle, totalAmount, orderId: order.id })
  return NextResponse.json({ ...order, amount_display: totalAmount, plan: planType, billingCycle, couponApplied: discountAmount > 0, discountAmount })
}

export async function PUT(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const csrf = csrfProtected(request)
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.message }, { status: csrf.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data, error } = validate(razorpayConfirmSchema, body)
  if (error || !data) {
    return NextResponse.json({ error: error || 'Invalid input' }, { status: 400 })
  }

  const { paymentId, orderId, signature, planType, billingCycle = 'monthly' } = data

  const expectedSig = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signature))) {
    logger.warn('Razorpay signature mismatch', { userId: user.id, orderId })
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const months = billingCycle === 'annual' ? 12 : 1
  const periodEnd = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)

  await supabase
    .from('subscriptions')
    .update({
      razorpay_payment_id: paymentId,
      status: 'active',
      plan_type: planType,
      billing_cycle: billingCycle,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq('razorpay_order_id', orderId)

  const planName = planType.replace('_monthly', '').replace('_annual', '')
  
  await supabase
    .from('profiles')
    .update({
      plan: planName,
      plan_expiry: periodEnd.toISOString(),
      billing_cycle: billingCycle,
    })
    .eq('user_id', user.id)

  logger.info('Payment confirmed and subscription activated', { userId: user.id, planType, billingCycle, paymentId, orderId })
  return NextResponse.json({ ok: true })
}