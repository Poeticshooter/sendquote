"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { motion } from "framer-motion"

type ActivityLog = {
  id: string
  action: string
  entity_type: string
  metadata: Record<string, unknown>
  created_at: string
}

const actionIcons: Record<string, React.ReactNode> = {
  quote_created: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  quote_sent: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  ),
  quote_opened: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  quote_accepted: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  quote_changes_requested: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  ),
  invoice_created: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  payment_recorded: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
}

const actionLabels: Record<string, string> = {
  quote_created: "Quote created",
  quote_sent: "Quote sent",
  quote_opened: "Quote opened",
  quote_accepted: "Quote accepted",
  quote_changes_requested: "Changes requested",
  invoice_created: "Invoice created",
  payment_recorded: "Payment recorded",
}

interface ActivityTimelineProps {
  entityType: 'quote' | 'invoice'
  entityId: string
}

export default function ActivityTimeline({ entityType, entityId }: ActivityTimelineProps) {
  const supabase = createClient()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setLogs((data as ActivityLog[]) || [])
      setLoading(false)
    }

    fetchLogs()
  }, [entityType, entityId, supabase])

  if (loading) {
    return <div className="text-sm text-slate-400 py-4">Loading activity...</div>
  }

  if (logs.length === 0) {
    return <div className="text-sm text-slate-400 py-4">No activity recorded yet.</div>
  }

  return (
    <div className="space-y-0">
      {logs.map((log, i) => {
        const icon = actionIcons[log.action] || (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
        const label = actionLabels[log.action] || log.action
        const time = new Date(log.created_at).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })

        return (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex gap-3"
          >
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                log.action.includes('accepted') || log.action.includes('payment')
                  ? 'bg-emerald-100 text-emerald-600'
                  : log.action.includes('opened') || log.action.includes('sent')
                  ? 'bg-blue-100 text-blue-600'
                  : log.action.includes('changes')
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {icon}
              </div>
              {i < logs.length - 1 && <div className="w-px h-full bg-slate-200 min-h-[24px]" />}
            </div>
            <div className="pb-6">
              <p className="text-sm font-medium text-slate-900">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{time}</p>
              {(() => {
                const note = log.metadata?.notes
                if (typeof note === 'string' && note) {
                  return <p className="text-xs text-slate-500 mt-1">{note}</p>
                }
                return null
              })()}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
