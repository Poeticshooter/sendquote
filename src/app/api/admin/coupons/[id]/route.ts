import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-auth'

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json()
  const { description, discount_type, discount_value, applies_to, billing_cycle, max_uses, expires_at, active } = body

  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {}
  if (description !== undefined) updateData.description = description
  if (discount_type !== undefined) {
    if (!['percentage', 'fixed'].includes(discount_type)) {
      return NextResponse.json({ error: 'discount_type must be percentage or fixed' }, { status: 400 })
    }
    updateData.discount_type = discount_type
  }
  if (discount_value !== undefined) updateData.discount_value = discount_value
  if (applies_to !== undefined) updateData.applies_to = applies_to
  if (billing_cycle !== undefined) updateData.billing_cycle = billing_cycle
  if (max_uses !== undefined) updateData.max_uses = max_uses
  if (expires_at !== undefined) updateData.expires_at = expires_at
  if (active !== undefined) updateData.active = active

  const { data: coupon, error } = await supabase
    .from('coupons')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!coupon) {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
  }

  return NextResponse.json({ coupon })
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
