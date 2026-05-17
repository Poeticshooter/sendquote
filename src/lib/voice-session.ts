import { createClient } from '@/lib/supabase'

export interface VoiceMessage {
  role: 'user' | 'assistant'
  text: string
  confidence?: number
  timestamp?: string
}

export interface VoiceSessionData {
  id?: string
  messages: VoiceMessage[]
  context?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

const MAX_MESSAGES = 50
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000 // 24 hours

export function messagesToStored(messages: Array<{ role: 'user' | 'assistant'; text: string; confidence?: number }>): VoiceMessage[] {
  return messages.map(m => ({ role: m.role, text: m.text, confidence: m.confidence, timestamp: new Date().toISOString() }))
}

export function storedToMessages(stored: VoiceMessage[]): Array<{ role: 'user' | 'assistant'; text: string; confidence?: number }> {
  return stored.map(s => ({ role: s.role, text: s.text, confidence: s.confidence }))
}

export async function loadVoiceSession(userId: string): Promise<VoiceSessionData | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('voice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    // Check if session is still active (within 24h)
    const updatedAt = new Date(data.updated_at).getTime()
    if (Date.now() - updatedAt > SESSION_TIMEOUT_MS) {
      return null
    }

    return {
      id: data.id,
      messages: data.messages || [],
      context: data.context || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch {
    return null
  }
}

export async function saveVoiceSession(
  userId: string,
  sessionId: string | null,
  messages: VoiceMessage[],
  context?: Record<string, unknown>
): Promise<string | null> {
  try {
    const supabase = createClient()
    const trimmedMessages = messages.slice(-MAX_MESSAGES)

    if (sessionId) {
      const { error } = await supabase
        .from('voice_sessions')
        .update({
          messages: trimmedMessages,
          context: context || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('user_id', userId)

      if (error) return null
      return sessionId
    } else {
      const { data, error } = await supabase
        .from('voice_sessions')
        .insert({
          user_id: userId,
          messages: trimmedMessages,
          context: context || null,
        })
        .select('id')
        .single()

      if (error || !data) return null
      return data.id
    }
  } catch {
    return null
  }
}

export async function clearVoiceSession(userId: string, sessionId?: string): Promise<boolean> {
  try {
    const supabase = createClient()
    if (sessionId) {
      const { error } = await supabase
        .from('voice_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId)
      return !error
    } else {
      const { error } = await supabase
        .from('voice_sessions')
        .delete()
        .eq('user_id', userId)
      return !error
    }
  } catch {
    return false
  }
}

export async function getVoiceSessionHistory(
  userId: string,
  limit = 10
): Promise<VoiceSessionData[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('voice_sessions')
      .select('id, messages, context, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) return []

    return (data || []).map(d => ({
      id: d.id,
      messages: d.messages || [],
      context: d.context || null,
      created_at: d.created_at,
      updated_at: d.updated_at,
    }))
  } catch {
    return []
  }
}
