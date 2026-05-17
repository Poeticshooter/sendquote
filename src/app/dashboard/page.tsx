import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import DashboardShell from './DashboardShell'
import ErrorBoundary from '@/components/error-boundary'

const PAGE_SIZE = 25

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    profileRes,
    quotesRes,
    statsRes,
    clientsRes,
    monthlyRes,
  ] = await Promise.all([
    supabase.from('profiles').select('business_name, plan, voice_enabled, voice_language, tts_rate, upi_id, smtp_email').eq('user_id', user.id).single(),
    supabase.from('quotes').select('id, quote_number, client_name, total, status, created_at, unique_token, valid_until').eq('user_id', user.id).order('created_at', { ascending: false }).range(0, PAGE_SIZE - 1),
    supabase.rpc('get_dashboard_stats', { p_user_id: user.id }),
    supabase.from('quotes').select('client_name').eq('user_id', user.id).not('client_name', 'is', null),
    supabase.from('quotes').select('created_at, total').eq('user_id', user.id).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString()),
  ])

  const profile = profileRes.data
  const quotes = (quotesRes.data || []) as Array<{
    id: string
    quote_number: string
    client_name: string
    total: number
    status: string
    created_at: string
    unique_token: string
    valid_until?: string
  }>
  const stats = (statsRes.data as Record<string, unknown>) || {}
  const monthlyDataRaw = (monthlyRes.data || []) as Array<{ created_at: string; total: number }>

  const uniqueClients = [...new Set((clientsRes.data || []).map((c: { client_name: string }) => c.client_name))]

  const months: { start: Date; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push({ start: new Date(d.getFullYear(), d.getMonth(), 1), label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) })
  }

  const monthlyData = months.map(m => {
    const next = new Date(m.start)
    next.setMonth(next.getMonth() + 1)
    const inMonth = monthlyDataRaw.filter(q => {
      const d = new Date(q.created_at)
      return d >= m.start && d < next
    })
    return { label: m.label, count: inMonth.length, value: inMonth.reduce((s, q) => s + Number(q.total), 0) }
  })

  const now = new Date()
  const expiredIds = quotes
    .filter(q => q.status === 'sent' && q.valid_until && new Date(q.valid_until) < now)
    .map(q => q.id)

  if (expiredIds.length > 0) {
    await supabase.from('quotes').update({ status: 'expired' }).in('id', expiredIds)
  }

  return (
    <ErrorBoundary>
      <DashboardShell
        initialQuotes={quotes}
        initialProfile={profile}
        initialStats={{
          total_quotes: (stats.total_quotes as number) || 0,
          total_value: Number(stats.total_value) || 0,
          accepted: (stats.accepted as number) || 0,
          outstanding: Number(stats.outstanding) || 0,
          overdue: Number(stats.overdue) || 0,
          month_count: (stats.month_count as number) || 0,
        }}
        monthlyData={monthlyData}
        clients={uniqueClients}
        userId={user.id}
      />
    </ErrorBoundary>
  )
}
