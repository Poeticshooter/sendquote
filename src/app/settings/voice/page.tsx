import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import VoiceSettingsClient from './VoiceSettingsClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Voice Settings — SendQuote",
  description: "Manage voice assistant language and chat history.",
  robots: { index: false, follow: false },
}

export default async function VoiceSettingsPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessions } = await supabase
    .from('voice_sessions')
    .select('id, messages, context, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20)

  const { data: profile } = await supabase
    .from('profiles')
    .select('voice_language, voice_enabled, tts_rate')
    .eq('user_id', user.id)
    .single()

  return (
    <VoiceSettingsClient
      sessions={sessions || []}
      profile={profile}
    />
  )
}
