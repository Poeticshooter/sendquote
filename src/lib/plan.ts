import { createAdminClient } from '@/lib/supabase'

type QuotaResult = { allowed: boolean; remaining: number }

export async function checkQuota(
  userId: string,
  action: 'quote' | 'invoice'
): Promise<QuotaResult> {
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, monthly_quote_count, last_quote_reset, invoice_counter')
    .eq('user_id', userId)
    .single()

  if (!profile) {
    return { allowed: false, remaining: 0 }
  }

  const { count: activeCoupons } = await supabase
    .from('coupon_usages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gt('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

  if (activeCoupons && activeCoupons > 0) {
    return { allowed: true, remaining: Infinity }
  }

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const resetMonth = profile.last_quote_reset
    ? new Date(profile.last_quote_reset).toISOString().slice(0, 7)
    : ''

  if (resetMonth !== currentMonth) {
    await supabase
      .from('profiles')
      .update({ monthly_quote_count: 0, last_quote_reset: now.toISOString() })
      .eq('user_id', userId)
    profile.monthly_quote_count = 0
    profile.last_quote_reset = now.toISOString()
  }

  if (profile.plan === 'free') {
    const maxQuotes = 5
    const remaining = Math.max(0, maxQuotes - (profile.monthly_quote_count || 0))
    return { allowed: remaining > 0, remaining }
  }

  return { allowed: true, remaining: Infinity }
}

export async function incrementQuoteCount(userId: string): Promise<void> {
  const supabase = createAdminClient()

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_quote_reset')
    .eq('user_id', userId)
    .single()

  const resetMonth = profile?.last_quote_reset
    ? new Date(profile.last_quote_reset).toISOString().slice(0, 7)
    : ''

  if (resetMonth !== currentMonth) {
    await supabase
      .from('profiles')
      .update({ monthly_quote_count: 1, last_quote_reset: now.toISOString() })
      .eq('user_id', userId)
  } else {
    await supabase.rpc('increment_monthly_quote_count', { p_user_id: userId })
  }
}
