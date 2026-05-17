import { NextRequest, NextResponse } from 'next/server'
import {
  remindFollowUp,
  remindAfterOpen,
  remindExpiry,
} from '@/lib/email'
import { createAdminClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for cron jobs')
}

const SUPABASE_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

const CRON_SECRET = process.env.CRON_SECRET

async function supabaseGet(table: string, filter: string, select = '*') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=${select}`, {
    headers: SUPABASE_HEADERS,
  })
  if (!res.ok) {
    logger.error('Supabase GET failed', { table, status: res.status })
    return []
  }
  return res.json()
}

async function supabasePatch(table: string, filter: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    logger.error('Supabase PATCH failed', { table, status: res.status })
    throw new Error(`Supabase error: ${res.status}`)
  }
}

async function supabaseInsert(table: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    logger.error('Supabase INSERT failed', { table, status: res.status })
    throw new Error(`Supabase error: ${res.status}`)
  }
}

async function batchGetEmails(userIds: string[]): Promise<Map<string, string>> {
  const supabase = createAdminClient()
  const emailMap = new Map<string, string>()

  for (const userId of userIds) {
    const { data, error } = await supabase.auth.admin.getUserById(userId)
    if (!error && data?.user?.email) {
      emailMap.set(userId, data.user.email)
    }
  }

  return emailMap
}

async function batchCheckReminders(quoteIds: string[], type: string): Promise<Set<string>> {
  if (quoteIds.length === 0) return new Set()
  const ids = quoteIds.map(id => `quote_id=eq.${id}`).join(',')
  const reminders = await supabaseGet('cron_reminders', `or=(${ids})&reminder_type=eq.${type}`, 'quote_id')
  return new Set((reminders || []).map((r: { quote_id: string }) => r.quote_id))
}

async function batchMarkReminders(reminders: Array<{ quote_id: string; reminder_type: string }>) {
  if (reminders.length === 0) return
  await supabaseInsert('cron_reminders', reminders[0])
  for (let i = 1; i < reminders.length; i++) {
    try {
      await supabaseInsert('cron_reminders', reminders[i])
    } catch {
      // Ignore duplicate key errors
    }
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('x-cron-secret')
  const authParam = request.nextUrl.searchParams.get('secret')

  if (authHeader !== CRON_SECRET && authParam !== CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results: string[] = []
  const startTime = Date.now()

  logger.info('Cron job started', { timestamp: now.toISOString() })

  // 1. Follow-up reminders for quotes sent 2+ days ago, not yet opened
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
  const unopenedRes = await fetch(`${SUPABASE_URL}/rest/v1/quotes?status=eq.sent&created_at=lt.${twoDaysAgo}&select=id,quote_number,client_name,user_id`, {
    headers: SUPABASE_HEADERS,
  })
  const unopened = await unopenedRes.json()

  if (unopened?.length > 0) {
    const typedUnopened = unopened as Array<{ id: string; user_id: string; quote_number: string; client_name: string }>
    const quoteIds = typedUnopened.map(q => q.id)
    const alreadySent = await batchCheckReminders(quoteIds, 'follow_up')
    const userIds = [...new Set(typedUnopened.filter(q => !alreadySent.has(q.id)).map(q => q.user_id))]
    const emails = await batchGetEmails(userIds)

    const toRemind = typedUnopened.filter(q => !alreadySent.has(q.id) && emails.has(q.user_id))
    for (const q of toRemind) {
      try {
        await remindFollowUp(emails.get(q.user_id)!, q.client_name, q.quote_number)
        results.push(`Reminded follow-up for ${q.quote_number}`)
      } catch (e) {
        results.push(`Failed follow-up for ${q.quote_number}: ${e}`)
      }
    }
    await batchMarkReminders(toRemind.map(q => ({ quote_id: q.id, reminder_type: 'follow_up' })))
  }

  // 2. After-open reminders (24h after opening, no action taken)
  const openedRes = await fetch(`${SUPABASE_URL}/rest/v1/quotes?status=eq.opened&select=id,quote_number,client_name,user_id`, {
    headers: SUPABASE_HEADERS,
  })
  const openedButNoAction = await openedRes.json()

  if (openedButNoAction?.length > 0) {
    const typedOpened = openedButNoAction as Array<{ id: string; user_id: string; quote_number: string; client_name: string }>
    const quoteIds = typedOpened.map(q => q.id)
    const alreadySent = await batchCheckReminders(quoteIds, 'after_open')

    const events = await supabaseGet('quote_events', `quote_id=in.(${quoteIds.join(',')})&event_type=eq.opened&order=created_at.desc&select=quote_id,created_at`)

    const latestOpens = new Map<string, string>()
    for (const event of events || []) {
      if (!latestOpens.has(event.quote_id)) {
        latestOpens.set(event.quote_id, event.created_at)
      }
    }

    const userIds = [...new Set(typedOpened.filter(q => {
      const lastOpen = latestOpens.get(q.id)
      return !alreadySent.has(q.id) && lastOpen && (now.getTime() - new Date(lastOpen).getTime() > 24 * 60 * 60 * 1000)
    }).map(q => q.user_id))]
    const emails = await batchGetEmails(userIds)

    const toRemind = typedOpened.filter(q => {
      const lastOpen = latestOpens.get(q.id)
      return !alreadySent.has(q.id) && lastOpen && (now.getTime() - new Date(lastOpen).getTime() > 24 * 60 * 60 * 1000) && emails.has(q.user_id)
    })
    for (const q of toRemind) {
      try {
        await remindAfterOpen(emails.get(q.user_id)!, q.client_name, q.quote_number)
        results.push(`Reminded after-open for ${q.quote_number}`)
      } catch (e) {
        results.push(`Failed after-open for ${q.quote_number}: ${e}`)
      }
    }
    await batchMarkReminders(toRemind.map(q => ({ quote_id: q.id, reminder_type: 'after_open' })))
  }

  // 3. Expiry warnings for quotes expiring tomorrow
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  const expiringRes = await fetch(`${SUPABASE_URL}/rest/v1/quotes?valid_until=eq.${tomorrowStr}&status=in.(sent,opened)&select=id,quote_number,client_name,user_id`, {
    headers: SUPABASE_HEADERS,
  })
  const expiring = await expiringRes.json()

  if (expiring?.length > 0) {
    const typedExpiring = expiring as Array<{ id: string; user_id: string; quote_number: string; client_name: string }>
    const quoteIds = typedExpiring.map(q => q.id)
    const alreadySent = await batchCheckReminders(quoteIds, 'expiry_warning')
    const userIds = [...new Set(typedExpiring.filter(q => !alreadySent.has(q.id)).map(q => q.user_id))]
    const emails = await batchGetEmails(userIds)

    const toRemind = typedExpiring.filter(q => !alreadySent.has(q.id) && emails.has(q.user_id))
    for (const q of toRemind) {
      try {
        await remindExpiry(emails.get(q.user_id)!, q.client_name, q.quote_number)
        results.push(`Reminded expiry for ${q.quote_number}`)
      } catch (e) {
        results.push(`Failed expiry for ${q.quote_number}: ${e}`)
      }
    }
    await batchMarkReminders(toRemind.map(q => ({ quote_id: q.id, reminder_type: 'expiry_warning' })))
  }

  // 4. Auto-expire past-due quotes
  const todayStr = now.toISOString().split('T')[0]
  const expiredRes = await fetch(`${SUPABASE_URL}/rest/v1/quotes?valid_until=lt.${todayStr}&status=in.(sent,opened)&select=id`, {
    method: 'PATCH',
    headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify({ status: 'expired', updated_at: now.toISOString() })
  })
  const expired = await expiredRes.json()
  const expiredCount = expired?.length || 0
  results.push(`Expired ${expiredCount} past-due quotes`)

  // 5. Overdue invoice reminders (skip if already reminded within last 7 days)
  const overdueInvoicesRes = await fetch(`${SUPABASE_URL}/rest/v1/invoices?status=eq.unpaid&due_date=lt.${todayStr}&select=id,invoice_number,client_name,user_id,total`, {
    headers: SUPABASE_HEADERS,
  })
  const overdue = await overdueInvoicesRes.json()

  if (overdue?.length > 0) {
    const typedOverdue = overdue as Array<{ id: string; user_id: string; invoice_number: string; client_name: string }>
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const invoiceIds = typedOverdue.map(inv => inv.id)
    const recentReminders = await supabaseGet('cron_reminders', `or=(${invoiceIds.map(id => `quote_id=eq.${id}`).join(',')})&reminder_type=eq.invoice_overdue&sent_at=gte.${weekAgo}`, 'quote_id')
    const recentlyRemindedIds = new Set((recentReminders || []).map((r: { quote_id: string }) => r.quote_id))

    const userIds = [...new Set(typedOverdue.filter(inv => !recentlyRemindedIds.has(inv.id)).map(inv => inv.user_id))]
    const emails = await batchGetEmails(userIds)

    const toRemind = typedOverdue.filter(inv => !recentlyRemindedIds.has(inv.id) && emails.has(inv.user_id))
    for (const inv of toRemind) {
      try {
        await remindExpiry(emails.get(inv.user_id)!, inv.client_name, inv.invoice_number)
        results.push(`Reminded overdue invoice ${inv.invoice_number}`)
      } catch (e) {
        results.push(`Failed invoice reminder ${inv.invoice_number}: ${e}`)
      }
    }
    await batchMarkReminders(toRemind.map(inv => ({ quote_id: inv.id, reminder_type: 'invoice_overdue' })))
  }

  // 6. Archive old quote_events (older than 90 days)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
  try {
    await supabasePatch('quote_events', `created_at=lt.${ninetyDaysAgo}`, {})
    await fetch(`${SUPABASE_URL}/rest/v1/quote_events?created_at=lt.${ninetyDaysAgo}`, {
      method: 'DELETE',
      headers: SUPABASE_HEADERS,
    })
    results.push('Archived quote_events older than 90 days')
  } catch (e) {
    results.push(`Failed to archive quote_events: ${e}`)
  }

  // 7. Prune activity_logs (older than 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/activity_logs?created_at=lt.${thirtyDaysAgo}`, {
      method: 'DELETE',
      headers: SUPABASE_HEADERS,
    })
    results.push('Pruned activity_logs older than 30 days')
  } catch (e) {
    results.push(`Failed to prune activity_logs: ${e}`)
  }

  // 8. Clean expired admin sessions
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/cleanup_expired_admin_sessions`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
    })
    results.push('Cleaned expired admin sessions')
  } catch (e) {
    results.push(`Failed to clean admin sessions: ${e}`)
  }

  // 9. Purge soft-deleted quotes older than 24 hours
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/purge_soft_deleted_quotes`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
    })
    results.push('Purged soft-deleted quotes older than 24 hours')
  } catch (e) {
    results.push(`Failed to purge soft-deleted quotes: ${e}`)
  }

  // 10. Downgrade expired plans
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/downgrade_expired_plans`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
    })
    results.push('Downgraded expired plans to free')
  } catch (e) {
    results.push(`Failed to downgrade expired plans: ${e}`)
  }

  const duration = Date.now() - startTime
  logger.info('Cron job completed', { durationMs: duration, resultCount: results.length })

  return NextResponse.json({ ok: true, results })
}
