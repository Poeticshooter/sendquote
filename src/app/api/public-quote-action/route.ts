import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.EMAIL_FROM_ADDRESS || 'quotes@resend.dev'

function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>')
}

function sanitizeForHeader(text: string | null | undefined): string {
  if (!text) return ''
  return String(text).replace(/[\r\n]/g, '')
}

export async function POST(request: NextRequest) {
  const { token, action, notes } = await request.json()

  if (!token || !action) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  if (!['accepted', 'changes_requested'].includes(action)) {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Get quote directly
  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('unique_token', token)
    .single()

  if (!quote) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  // Update status
  const actionStatusMap: Record<string, string> = {
    accepted: 'accepted',
    changes_requested: 'changes_requested',
  }
  const newStatus = actionStatusMap[action]
  if (newStatus) {
    await supabase
      .from('quotes')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('unique_token', token)
  }

  // Record event
  await supabase
    .from('quote_events')
    .insert({
      quote_id: quote.id,
      event_type: action,
      notes: notes || ''
    })

  // Get sender email from auth.users
  const { data: userData } = await supabase
    .auth.admin.getUserById(quote.user_id)
  
  const senderEmail = userData?.user?.email
  if (!senderEmail) {
    return NextResponse.json({ ok: true })
  }

  // Get sender business name
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name')
    .eq('user_id', quote.user_id)
    .single()

  try {
    const safeClientName = sanitizeForHeader(quote.client_name)
    const safeBusinessName = escapeHtml(profile?.business_name || '')
    const safeQuoteNumber = escapeHtml(quote.quote_number)
    const safeNotes = notes ? escapeHtml(notes) : ''

    if (action === 'accepted') {
      await resend.emails.send({
        from: FROM,
        to: senderEmail,
        subject: `✅ ${safeClientName} accepted your quote #${safeQuoteNumber}`,
        html: `<p>Hi ${safeBusinessName || 'there'},</p>
<p>Great news! <strong>${escapeHtml(quote.client_name)}</strong> has accepted your quote <strong>#${safeQuoteNumber}</strong>.</p>
<p>The quote status has been updated to 'Accepted'.</p>`,
      })
    } else if (action === 'changes_requested') {
      await resend.emails.send({
        from: FROM,
        to: senderEmail,
        subject: `✏️ ${safeClientName} requested changes on #${safeQuoteNumber}`,
        html: `<p>Hi ${safeBusinessName || 'there'},</p>
<p><strong>${escapeHtml(quote.client_name)}</strong> has requested changes on quote <strong>#${safeQuoteNumber}</strong>.</p>
${safeNotes ? `<p><strong>Message:</strong> ${safeNotes}</p>` : ''}
<p>Consider revising the quote and sending it again.</p>`,
      })
    }
  } catch {
    console.error('Failed to send email notification for quote action')
  }

  return NextResponse.json({ ok: true })
}