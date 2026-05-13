import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import crypto from 'crypto'

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabase = createAdminClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!error && user) return user
  }
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!
const GST_RATE = 18
const ANNUAL_DISCOUNT = 10

const PLAN_PRICES: Record<string, number> = {
  starter_monthly: 299,
  starter_annual: 299 * 12 * (100 - ANNUAL_DISCOUNT) / 100,
}

export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { planType, billingCycle = 'monthly', basePrice, discount = 0, gst = 0, total } = await request.json()

  let amount = PLAN_PRICES[planType] || 299
  
  if (total) {
    amount = Math.round(total)
  } else {
    const base = billingCycle === 'annual' ? amount : 299
    const discountAmount = billingCycle === 'annual' ? (base * ANNUAL_DISCOUNT) / 100 : 0
    const subtotal = base - discountAmount
    const gstAmount = (subtotal * GST_RATE) / 100
    amount = Math.round(subtotal + gstAmount)
  }

  const supabase = createAdminClient()

  const auth = Buffer.from(`${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount * 100,
      currency: 'INR',
      receipt: `sub_${user.id.substring(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        planType: planType,
        billingCycle: billingCycle,
        basePrice: basePrice || amount,
        discount: discount,
        gst: gst,
        total: total || amount,
      },
    }),
  })

  const order = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: order.error?.description || 'Payment failed' }, { status: 400 })
  }

  await supabase.from('subscriptions').insert({
    user_id: user.id,
    razorpay_order_id: order.id,
    plan_type: planType,
    billing_cycle: billingCycle,
    base_price: basePrice || amount,
    discount_amount: discount,
    gst_amount: gst,
    total_amount: total || amount,
    amount: (total || amount),
    status: 'inactive',
  })

  return NextResponse.json({ ...order, amount_display: amount, plan: planType, billingCycle })
}

export async function PUT(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { paymentId, orderId, signature, planType, billingCycle = 'monthly' } = await request.json()

  if (!paymentId || !orderId || !signature) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const expectedSig = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  if (expectedSig !== signature) {
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

  return NextResponse.json({ ok: true })
}