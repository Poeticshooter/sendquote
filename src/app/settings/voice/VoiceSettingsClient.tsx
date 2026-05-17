"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/toast"
import { LANGUAGE_LABELS } from "@/lib/voice-locales"

interface Session {
  id: string
  messages: Array<{ role: string; text: string }>
  context?: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface VoiceSettingsClientProps {
  sessions: Session[]
  profile?: {
    voice_language?: string
    voice_enabled?: boolean
    tts_rate?: number
  } | null
}

export default function VoiceSettingsClient({ sessions, profile }: VoiceSettingsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteSession(sessionId: string) {
    setDeleting(true)
    const { error } = await supabase
      .from('voice_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      toast("Failed to delete session", "error")
    } else {
      toast("Session deleted", "success")
      router.refresh()
    }
    setDeleting(false)
  }

  async function handleClearAll() {
    setDeleting(true)
    const { error } = await supabase
      .from('voice_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) {
      toast("Failed to clear sessions", "error")
    } else {
      toast("All sessions cleared", "success")
      router.refresh()
    }
    setDeleting(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/settings" className="text-sm text-indigo-600 hover:text-indigo-700 mb-4 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Settings
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Voice Assistant Settings</h1>
        <p className="text-slate-500 mt-1">Manage voice language, chat history, and preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Voice Language</label>
              <p className="text-sm text-slate-500">
                {LANGUAGE_LABELS[profile?.voice_language || 'en-IN'] || 'English'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Voice Enabled</label>
              <p className="text-sm text-slate-500">
                {profile?.voice_enabled !== false ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">TTS Rate</label>
              <p className="text-sm text-slate-500">
                {profile?.tts_rate || 1.0}x
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Chat History</h2>
            {sessions.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={deleting}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Clear All
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-slate-500 text-sm">No chat history yet.</p>
              <p className="text-slate-400 text-xs mt-1">Your voice conversations will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const lastMessage = session.messages[session.messages.length - 1]
                const isExpanded = expandedSession === session.id
                const messageCount = session.messages.length

                return (
                  <div
                    key={session.id}
                    className="border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                      className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {lastMessage?.text || 'Empty session'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {messageCount} messages &middot; Updated {new Date(session.updated_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id) }}
                            disabled={deleting}
                            className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <svg
                            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 bg-slate-50 border-t border-slate-200">
                        <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                          {session.messages.map((msg, i) => (
                            <div
                              key={i}
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                                  msg.role === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-slate-700 border border-slate-200'
                                }`}
                              >
                                {msg.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
