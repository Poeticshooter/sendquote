import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sanitizeInput } from '@/lib/sanitize'
import { sendEmail } from '@/lib/email'
import { validate, publicQuoteActionSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

function sanitizeForHeader(text: string | null | undefined): string {
  if (!text) return ''
  return String(text).replace(/[\r\n]/g, '')
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data, error } = validate(publicQuoteActionSchema, body)
  if (error || !data) {
    return NextResponse.json({ error: error || 'Invalid input' }, { status: 400 })
  }

  const { token, action, notes } = data

  const supabase = createAdminClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select('id, user_id, client_name, quote_number')
    .eq('unique_token', token)
    .single()

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  const newStatus = action === 'accepted' ? 'accepted' : 'changes_requested'
  await supabase
    .from('quotes')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('unique_token', token)

  await supabase
    .from('quote_events')
    .insert({
      quote_id: quote.id,
      event_type: action,
      notes: sanitizeInput(notes || '')
    })

  const { logActivity } = await import('@/lib/activity')
  await logActivity(quote.user_id, 'quote', quote.id, `quote_${action}`, { notes: notes || '', from: 'client' })

  const { data: userData } = await supabase
    .auth.admin.getUserById(quote.user_id)

  const senderEmail = userData?.user?.email
  if (!senderEmail) {
    return NextResponse.json({ ok: true })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, smtp_email, smtp_app_password')
    .eq('user_id', quote.user_id)
    .single()

  try {
    const safeClientName = sanitizeForHeader(quote.client_name)
    const safeQuoteNumber = quote.quote_number

    if (action === 'accepted') {
      await sendEmail(
        { smtpEmail: profile?.smtp_email, smtpAppPassword: profile?.smtp_app_password },
        senderEmail,
        `Quote #${safeQuoteNumber} accepted by ${safeClientName}`,
        `<p>Hi ${profile?.business_name || 'there'},</p>
<p>Great news! <strong>${quote.client_name}</strong> has accepted your quote <strong>#${safeQuoteNumber}</strong>.</p>
<p>The quote status has been updated to 'Accepted'.</p>`,
      )
    } else if (action === 'changes_requested') {
      await sendEmail(
        { smtpEmail: profile?.smtp_email, smtpAppPassword: profile?.smtp_app_password },
        senderEmail,
        `Changes requested on quote #${safeQuoteNumber}`,
        `<p>Hi ${profile?.business_name || 'there'},</p>
<p><strong>${quote.client_name}</strong> has requested changes on quote <strong>#${safeQuoteNumber}</strong>.</p>
${notes ? `<p><strong>Message:</strong> ${notes}</p>` : ''}
<p>Consider revising the quote and sending it again.</p>`,
      )
    }
  } catch (err) {
    logger.error('Failed to send email notification for quote action', {
      quoteId: quote.id,
      action,
      error: err instanceof Error ? err.message : 'unknown',
    })
  }

  return NextResponse.json({ ok: true })
}
