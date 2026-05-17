import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import AnalyticsClient from './AnalyticsClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Analytics — SendQuote",
  description: "Track your quote performance, acceptance rates, and revenue insights.",
  robots: { index: false, follow: false },
}

export default async function AnalyticsPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const twelveWeeksAgo = new Date(new Date().getTime() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString()
  const sixMonthsAgo = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString()

  const [
    profileRes,
    allQuotesRes,
    weeklyCreatedRes,
    weeklyAcceptedRes,
    monthlyRevenueRes,
  ] = await Promise.all([
    supabase.from('profiles').select('business_name, plan').eq('user_id', user.id).single(),
    supabase.from('quotes').select('id, status, total, created_at').eq('user_id', user.id),
    supabase.from('quotes').select('created_at').eq('user_id', user.id).gte('created_at', twelveWeeksAgo).order('created_at', { ascending: true }),
    supabase.from('quotes').select('created_at').eq('user_id', user.id).eq('status', 'accepted').gte('created_at', twelveWeeksAgo).order('created_at', { ascending: true }),
    supabase.from('quotes').select('total, created_at').eq('user_id', user.id).eq('status', 'accepted').gte('created_at', sixMonthsAgo).order('created_at', { ascending: true }),
  ])

  const quotes = allQuotesRes.data || []
  const totalQuotes = quotes.length
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length
  const totalValueSent = quotes.reduce((sum, q) => sum + Number(q.total || 0), 0)
  const totalValueAccepted = quotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + Number(q.total || 0), 0)
  const avgQuoteValue = totalQuotes > 0 ? totalValueSent / totalQuotes : 0
  const acceptanceRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0

  const now = new Date()
  const weeklyData: { week: string; created: number; accepted: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - i * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 7)

    const created = (weeklyCreatedRes.data || []).filter(q => {
      const d = new Date(q.created_at)
      return d >= weekStart && d < weekEnd
    }).length

    const accepted = (weeklyAcceptedRes.data || []).filter(q => {
      const d = new Date(q.created_at)
      return d >= weekStart && d < weekEnd
    }).length

    weeklyData.push({
      week: weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      created,
      accepted,
    })
  }

  const months: { month: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1)

    const revenue = (monthlyRevenueRes.data || [])
      .filter(q => {
        const date = new Date(q.created_at)
        return date >= monthStart && date < monthEnd
      })
      .reduce((sum, q) => sum + Number(q.total || 0), 0)

    months.push({
      month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      revenue,
    })
  }

  const hasQuotes = totalQuotes > 0

  return (
    <AnalyticsClient
      profile={profileRes.data}
      stats={{
        totalQuotes,
        acceptedQuotes,
        totalValueSent,
        totalValueAccepted,
        avgQuoteValue,
        acceptanceRate,
      }}
      weeklyData={weeklyData}
      monthlyRevenue={months}
      hasQuotes={hasQuotes}
    />
  )
}
