import { createAdminClient } from '@/lib/supabase'

type EventType =
  | 'signup'
  | 'quote_created'
  | 'quote_sent'
  | 'quote_opened'
  | 'quote_accepted'
  | 'quote_changes_requested'
  | 'invoice_created'
  | 'upgrade_clicked'
  | 'payment_success'
  | 'payment_failed'

export async function trackEvent(
  userId: string | null,
  eventType: EventType,
  eventData?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData || {},
    })
  } catch (e) {
    console.error('trackEvent error:', e)
  }
}
