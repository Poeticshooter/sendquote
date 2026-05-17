import { createClient } from '@/lib/supabase'

export interface ProactiveSuggestion {
  type: 'follow_up' | 'expiry_warning' | 'draft_review' | 'accepted_action' | 'general'
  message: string
  action?: string
  actionLabel?: string
  priority: number // lower = higher priority
}

export async function generateProactiveSuggestions(userId: string): Promise<ProactiveSuggestion[]> {
  try {
    const supabase = createClient()
    const now = new Date()
    const suggestions: ProactiveSuggestion[] = []

    // Check for unopened quotes sent 2+ hours ago
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
    const { data: unopenedQuotes } = await supabase
      .from('quotes')
      .select('quote_number, client_name, sent_at')
      .eq('user_id', userId)
      .eq('status', 'sent')
      .lt('sent_at', twoHoursAgo)
      .limit(3)

    if (unopenedQuotes && unopenedQuotes.length > 0) {
      const first = unopenedQuotes[0]
      suggestions.push({
        type: 'follow_up',
        message: `${first.client_name} hasn't opened quote ${first.quote_number} yet. Want to send a follow-up?`,
        action: 'follow_up_quote',
        actionLabel: 'Send Follow-up',
        priority: 1,
      })
    }

    // Check for quotes expiring within 48 hours
    const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
    const { data: expiringQuotes } = await supabase
      .from('quotes')
      .select('quote_number, client_name, valid_until')
      .eq('user_id', userId)
      .eq('status', 'sent')
      .lt('valid_until', twoDaysFromNow)
      .gt('valid_until', now.toISOString())
      .limit(3)

    if (expiringQuotes && expiringQuotes.length > 0) {
      const count = expiringQuotes.length
      suggestions.push({
        type: 'expiry_warning',
        message: `${count} quote${count > 1 ? 's' : ''} expiring soon. Want to check them?`,
        action: 'view_expiring',
        actionLabel: 'View Quotes',
        priority: 2,
      })
    }

    // Check for draft quotes
    const { data: draftQuotes } = await supabase
      .from('quotes')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .limit(5)

    if (draftQuotes && draftQuotes.length > 0) {
      const count = draftQuotes.length
      suggestions.push({
        type: 'draft_review',
        message: `You have ${count} draft quote${count > 1 ? 's' : ''}. Want to review and send them?`,
        action: 'review_drafts',
        actionLabel: 'Review Drafts',
        priority: 3,
      })
    }

    // Check for recently accepted quotes (ready to convert to invoice)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const { data: acceptedQuotes } = await supabase
      .from('quotes')
      .select('quote_number, client_name, total, accepted_at')
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .gt('accepted_at', oneDayAgo)
      .limit(3)

    if (acceptedQuotes && acceptedQuotes.length > 0) {
      const first = acceptedQuotes[0]
      suggestions.push({
        type: 'accepted_action',
        message: `${first.client_name} accepted quote ${first.quote_number} (₹${Number(first.total).toLocaleString('en-IN')}). Convert to invoice?`,
        action: `convert_invoice:${first.quote_number}`,
        actionLabel: 'Convert to Invoice',
        priority: 1,
      })
    }

    // Sort by priority
    suggestions.sort((a, b) => a.priority - b.priority)

    return suggestions.slice(0, 3) // Max 3 suggestions
  } catch {
    return []
  }
}
