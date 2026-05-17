import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ coupons: coupons || [] })
}

export async function POST(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { code, description, discount_type, discount_value, applies_to, billing_cycle, max_uses, expires_at } = body

  if (!code || !discount_type || discount_value == null) {
    return NextResponse.json({ error: 'code, discount_type, and discount_value are required' }, { status: 400 })
  }

  if (!['percentage', 'fixed'].includes(discount_type)) {
    return NextResponse.json({ error: 'discount_type must be percentage or fixed' }, { status: 400 })
  }

  if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
    return NextResponse.json({ error: 'percentage discount must be between 0 and 100' }, { status: 400 })
  }

  if (discount_type === 'fixed' && discount_value < 0) {
    return NextResponse.json({ error: 'fixed discount must be positive' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: coupon, error } = await supabase
    .from('coupons')
    .insert({
      code: code.toUpperCase(),
      description: description || null,
      discount_type,
      discount_value,
      applies_to: applies_to || 'all_plans',
      billing_cycle: billing_cycle || 'both',
      max_uses: max_uses || null,
      expires_at: expires_at || null,
      active: true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ coupon }, { status: 201 })
}
