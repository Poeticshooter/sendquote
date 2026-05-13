import { NextRequest, NextResponse } from 'next/server'
import {
  remindFollowUp,
  remindAfterOpen,
  remindExpiry,
} from '@/lib/email'

const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const url = process.env.NEXT_PUBLIC_SUPABASE_URL

async function getEmail(userId: string): Promise<string | null> {
  const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    headers: { 'Authorization': 'Bearer ' + key, 'apikey': key! }
  })
  const data = await res.json()
  return data?.email || null
}

// Called daily by cron-job.org
export async function GET(request: NextRequest) {
  const auth = request.nextUrl.searchParams.get('secret')
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results: string[] = []

  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
  const unopenedRes = await fetch(`${url}/rest/v1/quotes?status=eq.sent&created_at=lt.${twoDaysAgo}&select=id,quote_number,client_name,user_id`, {
    headers: { 'apikey': key!, 'Authorization': `Bearer ${key}` }
  })
  const unopened = await unopenedRes.json()

  for (const q of unopened || []) {
    const email = await getEmail(q.user_id)
    if (email) {
      try {
        await remindFollowUp(email, q.client_name, q.quote_number)
        results.push(`Reminded follow-up for ${q.quote_number}`)
      } catch (e) {
        results.push(`Failed follow-up for ${q.quote_number}: ${e}`)
      }
    }
  }

  const openedRes = await fetch(`${url}/rest/v1/quotes?status=eq.opened&select=id,quote_number,client_name,user_id`, {
    headers: { 'apikey': key!, 'Authorization': `Bearer ${key}` }
  })
  const openedButNoAction = await openedRes.json()

  for (const q of openedButNoAction || []) {
    const eventsRes = await fetch(`${url}/rest/v1/quote_events?quote_id=eq.${q.id}&event_type=eq.opened&order=created_at.desc&limit=1&select=created_at`, {
      headers: { 'apikey': key!, 'Authorization': `Bearer ${key}` }
    })
    const events = await eventsRes.json()

    if (events && events.length > 0) {
      const lastOpen = new Date(events[0].created_at)
      if (now.getTime() - lastOpen.getTime() > 24 * 60 * 60 * 1000) {
        const email = await getEmail(q.user_id)
        if (email) {
          try {
            await remindAfterOpen(email, q.client_name, q.quote_number)
            results.push(`Reminded after-open for ${q.quote_number}`)
          } catch (e) {
            results.push(`Failed after-open for ${q.quote_number}: ${e}`)
          }
        }
      }
    }
  }

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  const expiringRes = await fetch(`${url}/rest/v1/quotes?valid_till=eq.${tomorrowStr}&status=in.(sent,opened)&select=id,quote_number,client_name,user_id`, {
    headers: { 'apikey': key!, 'Authorization': `Bearer ${key}` }
  })
  const expiring = await expiringRes.json()

  for (const q of expiring || []) {
    const email = await getEmail(q.user_id)
    if (email) {
      try {
        await remindExpiry(email, q.client_name, q.quote_number)
        results.push(`Reminded expiry for ${q.quote_number}`)
      } catch (e) {
        results.push(`Failed expiry for ${q.quote_number}: ${e}`)
      }
    }
  }

  const todayStr = now.toISOString().split('T')[0]
  const expiredRes = await fetch(`${url}/rest/v1/quotes?valid_till=lt.${todayStr}&status=in.(sent,opened)&select=id`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'apikey': key!, 'Authorization': `Bearer ${key}`, 'Prefer': 'return=representation' },
    body: JSON.stringify({ status: 'expired', updated_at: now.toISOString() })
  })
  const expired = await expiredRes.json()

  results.push(`Expired ${expired?.length || 0} past-due quotes`)

  // Invoice payment reminders
  const overdueInvoices = await fetch(`${url}/rest/v1/invoices?status=eq.unpaid&due_date=lt.${todayStr}&select=id,invoice_number,client_name,user_id,total`, {
    headers: { 'apikey': key!, 'Authorization': `Bearer ${key}` }
  })
  const overdue = await overdueInvoices.json()

  for (const inv of overdue || []) {
    const email = await getEmail(inv.user_id)
    if (email) {
      try {
        const amount = Number(inv.total).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
        // Use existing remindExpiry template for now - could add dedicated invoice reminder
        await remindExpiry(email, inv.client_name, inv.invoice_number)
        results.push(`Reminded overdue invoice ${inv.invoice_number}`)
      } catch (e) {
        results.push(`Failed invoice reminder ${inv.invoice_number}: ${e}`)
      }
    }
  }

  return NextResponse.json({ ok: true, results })
}
