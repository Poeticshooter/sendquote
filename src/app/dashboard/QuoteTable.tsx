"use client"

import { useState } from "react"
import Link from "next/link"
import EmptyState from "@/components/empty-state"

type Quote = {
  id: string
  quote_number: string
  client_name: string
  total: number
  status: string
  created_at: string
  unique_token: string
  valid_until?: string
}

type QuoteTableProps = {
  quotes: Quote[]
  selectedQuotes: string[]
  onSelect: (id: string) => void
  onSelectAll: () => void
  onDuplicate: (quote: Quote, e: React.MouseEvent) => void
  onView: (quote: Quote) => void
}

type SortKey = "quote_number" | "client_name" | "total" | "status" | "created_at"
type SortDir = "asc" | "desc"

const statusStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  draft: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" /></svg>
  },
  sent: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
  },
  opened: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  },
  accepted: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
  },
  changes_requested: {
    bg: "bg-violet-100",
    text: "text-violet-700",
    icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
  },
  expired: {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  lost: {
    bg: "bg-slate-100",
    text: "text-slate-500",
    icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
  },
  archived: {
    bg: "bg-slate-100",
    text: "text-slate-400",
    icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8.25h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h12.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H6.75z" /></svg>
  },
}

export default function QuoteTable({ quotes, selectedQuotes, onSelect, onSelectAll, onDuplicate, onView }: QuoteTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir(key === "created_at" ? "desc" : "asc")
    }
  }

  const sortedQuotes = [...quotes].sort((a, b) => {
    let aVal: string | number = a[sortKey] ?? ""
    let bVal: string | number = b[sortKey] ?? ""

    if (sortKey === "total") {
      aVal = Number(aVal)
      bVal = Number(bVal)
    }

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1
    return 0
  })

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <span className="text-slate-300 dark:text-slate-600 ml-1">↕</span>
    return <span className="text-indigo-500 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
  }

  if (sortedQuotes.length === 0) {
    return (
      <EmptyState
        type="quotes"
        title="No quotes yet"
        description="Create your first quote and share it with a client"
        action={{ label: "Create Your First Quote", href: "/quote/new" }}
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-4 py-3.5 w-8">
              <input type="checkbox" checked={selectedQuotes.length === quotes.length && quotes.length > 0} onChange={onSelectAll} className="rounded border-slate-300" />
            </th>
            <th
              className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
              onClick={() => handleSort("quote_number")}
            >
              Quote <SortIcon column="quote_number" />
            </th>
            <th
              className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
              onClick={() => handleSort("client_name")}
            >
              Client <SortIcon column="client_name" />
            </th>
            <th
              className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
              onClick={() => handleSort("total")}
            >
              Amount <SortIcon column="total" />
            </th>
            <th
              className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
              onClick={() => handleSort("status")}
            >
              Status <SortIcon column="status" />
            </th>
            <th
              className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none hidden sm:table-cell"
              onClick={() => handleSort("created_at")}
            >
              Date <SortIcon column="created_at" />
            </th>
            <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedQuotes.map((q, i) => {
            const statusStyle = statusStyles[q.status] || statusStyles.draft
            return (
              <tr
                key={q.id}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors group animate-fade-in"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedQuotes.includes(q.id)} onChange={() => onSelect(q.id)} className="rounded border-slate-300" />
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-900 cursor-pointer" onClick={() => onView(q)}>{q.quote_number}</td>
                <td className="px-4 py-3.5 text-slate-700 cursor-pointer" onClick={() => onView(q)}>{q.client_name}</td>
                <td className="px-4 py-3.5 font-medium text-slate-900 cursor-pointer" onClick={() => onView(q)}>
                  ₹{Number(q.total).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3.5 cursor-pointer" onClick={() => onView(q)}>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full capitalize ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.icon}
                    {q.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-400 hidden sm:table-cell cursor-pointer" onClick={() => onView(q)}>
                  {new Date(q.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => onDuplicate(q, e)}
                      title="Duplicate quote"
                      className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onView(q)}
                      className="text-indigo-600 hover:text-indigo-700 text-xs font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 transition-all"
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
