export type QuoteStatus = 'draft' | 'sent' | 'opened' | 'accepted' | 'changes_requested' | 'expired' | 'archived' | 'lost'

export type AchievementType = 'first_quote' | 'ten_quotes' | 'fifty_quotes' | 'first_accepted' | 'five_accepted' | 'twenty_accepted' | 'first_payment' | 'high_win_rate' | 'first_client' | 'ten_clients' | 'streak_7' | 'streak_30' | 'team_player' | 'early_adopter' | 'referral_starter'

export interface Achievement {
  id: string
  user_id: string
  achievement: AchievementType
  unlocked_at: string
  metadata: Record<string, unknown> | null
}

export interface AchievementDefinition {
  key: AchievementType
  label: string
  description: string
  icon: string
  category: 'milestone' | 'engagement' | 'social'
  threshold?: number
}

export interface Referral {
  id: string
  referrer_id: string
  referred_email: string | null
  referred_id: string | null
  status: 'pending' | 'joined' | 'converted' | 'rewarded'
  reward_months: number
  created_at: string
}

export interface QuoteTemplate {
  id: string
  name: string
  description: string
  industry: string
  suggested_items: { description: string; quantity: number; rate: number; unit: string }[]
  suggested_terms: string | null
  suggested_payment_terms: string | null
  is_default: boolean
  created_at: string
}

export interface FollowupSequence {
  id: string
  user_id: string
  name: string
  trigger_days: number[]
  trigger_condition: 'sent' | 'opened_no_response' | 'expiring_soon' | 'expired'
  subject_template: string
  body_template: string
  is_active: boolean
  created_at: string
}

export interface FollowupSchedule {
  id: string
  quote_id: string
  sequence_id: string
  step: number
  scheduled_at: string
  sent_at: string | null
  status: 'pending' | 'sent' | 'cancelled'
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired'

export type PlanType = 'starter' | 'growth' | 'pro' | 'enterprise'

export type TeamRole = 'admin' | 'member' | 'viewer'

export type TeamMemberStatus = 'invited' | 'active' | 'removed'

export interface Organization {
  id: string
  name: string
  slug: string | null
  owner_id: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  business_name: string | null
  plan: PlanType
  plan_expiry: string | null
  billing_cycle: 'monthly' | 'annual'
  monthly_quote_count: number
  logo_url: string | null
  phone: string | null
  gst_number: string | null
  address: string | null
  referral_code: string | null
  upi_id: string | null
  smtp_email: string | null
  organization_id: string | null
  subscription_status: SubscriptionStatus
  quote_counter: number
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  user_id: string
  quote_number: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  client_address: string | null
  status: QuoteStatus
  items: QuoteItem[]
  subtotal: number
  tax: number
  discount: number
  discount_type: 'percentage' | 'fixed'
  gst_rate: number
  gst_amount: number
  total: number
  notes: string | null
  terms: string | null
  payment_terms: string | null
  valid_until: string | null
  public_token: string | null
  version: number
  parent_quote_id: string | null
  organization_id: string | null
  created_at: string
  updated_at: string
}

export interface QuoteItem {
  id: string
  quote_id: string | null
  description: string
  spec: string | null
  quantity: number
  unit: string
  rate: number
  amount: number
  sort_order: number
}

export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  gst_number: string | null
  notes: string | null
  total_quotes: number
  total_invoices: number
  total_revenue: number
  last_quote_date: string | null
  created_at: string
  updated_at: string
  organization_id: string | null
}

export interface Invoice {
  id: string
  user_id: string
  quote_id: string | null
  invoice_number: string
  client_name: string
  client_email: string | null
  client_address: string | null
  amount: number
  subtotal: number
  discount: number
  gst_rate: number
  gst_amount: number
  paid_amount: number
  balance_due: number
  status: InvoiceStatus
  due_date: string | null
  created_at: string
  updated_at: string
  organization_id: string | null
}
