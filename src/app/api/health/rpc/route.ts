import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

type RpcCheck = {
  name: string
  args: Record<string, unknown>
}

const CRITICAL_RPCS: RpcCheck[] = [
  { name: 'get_dashboard_stats', args: { p_user_id: '00000000-0000-0000-0000-000000000000' } },
  { name: 'next_quote_number', args: { p_user_id: '00000000-0000-0000-0000-000000000000' } },
  { name: 'get_quote_admin', args: { p_id: '00000000-0000-0000-0000-000000000000' } },
  { name: 'get_profile_admin', args: { p_user_id: '00000000-0000-0000-0000-000000000000' } },
  { name: 'get_quote_items', args: { p_quote_id: '00000000-0000-0000-0000-000000000000' } },
  { name: 'record_quote_action', args: { p_token: 'test', p_action: 'sent', p_notes: '' } },
  { name: 'cleanup_expired_admin_sessions', args: {} },
  { name: 'purge_soft_deleted_quotes', args: {} },
  { name: 'downgrade_expired_plans', args: {} },
]

export async function GET() {
  const supabase = createAdminClient()
  const results: Array<{ name: string; status: 'ok' | 'missing' | 'error'; error?: string }> = []

  for (const rpc of CRITICAL_RPCS) {
    try {
      const { error } = await supabase.rpc(rpc.name, rpc.args as any)
      if (error) {
        if (error.code === '42883') {
          results.push({ name: rpc.name, status: 'missing', error: error.message })
        } else {
          results.push({ name: rpc.name, status: 'error', error: error.message })
        }
      } else {
        results.push({ name: rpc.name, status: 'ok' })
      }
    } catch (err) {
      results.push({
        name: rpc.name,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const allOk = results.every(r => r.status === 'ok')
  const missing = results.filter(r => r.status === 'missing').map(r => r.name)

  return NextResponse.json({
    ok: allOk,
    timestamp: new Date().toISOString(),
    results,
    missing,
  }, { status: allOk ? 200 : 500 })
}
