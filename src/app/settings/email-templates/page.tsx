import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import EmailTemplatesClient from './EmailTemplatesClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Email Templates — SendQuote",
  description: "Customize email templates for quote events.",
  robots: { index: false, follow: false },
}

const TEMPLATE_KEYS = [
  { key: 'quote_opened', label: 'Quote Opened', description: 'Sent when a client opens your quote' },
  { key: 'quote_accepted', label: 'Quote Accepted', description: 'Sent when a client accepts your quote' },
  { key: 'quote_changes_requested', label: 'Changes Requested', description: 'Sent when a client requests changes' },
  { key: 'quote_follow_up', label: 'Follow Up Reminder', description: 'Sent when a quote has not been opened for 48+ hours' },
  { key: 'quote_expiry', label: 'Quote Expiry Warning', description: 'Sent 24 hours before a quote expires' },
]

export default async function EmailTemplatesPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .eq('user_id', user.id)

  const templateMap: Record<string, { subject: string; body_html: string }> = {}
  for (const tpl of (templates || [])) {
    templateMap[tpl.template_key] = { subject: tpl.subject, body_html: tpl.body_html }
  }

  return (
    <EmailTemplatesClient
      templates={templateMap}
      availableTemplates={TEMPLATE_KEYS}
    />
  )
}
