import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  const authSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { code, plan, billing_cycle } = body

  if (!code || !plan) {
    return NextResponse.json({ error: 'code and plan are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .single()

  if (!coupon) {
    return NextResponse.json({ valid: false, error: 'Invalid coupon code' }, { status: 200 })
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Coupon has expired' }, { status: 200 })
  }

  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ valid: false, error: 'Coupon usage limit reached' }, { status: 200 })
  }

  if (coupon.applies_to !== 'all_plans' && coupon.applies_to !== plan) {
    return NextResponse.json({ valid: false, error: 'Coupon does not apply to this plan' }, { status: 200 })
  }

  if (coupon.billing_cycle !== 'both' && coupon.billing_cycle !== billing_cycle) {
    return NextResponse.json({ valid: false, error: 'Coupon does not apply to this billing cycle' }, { status: 200 })
  }

  const { count: existingUsage } = await supabase
    .from('coupon_usages')
    .select('*', { count: 'exact', head: true })
    .eq('coupon_id', coupon.id)
    .eq('user_id', user.id)

  if (existingUsage && existingUsage > 0) {
    return NextResponse.json({ valid: false, error: 'You have already used this coupon' }, { status: 200 })
  }

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: Number(coupon.discount_value),
    description: coupon.description,
  })
}
