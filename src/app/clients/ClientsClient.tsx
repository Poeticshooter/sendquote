"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { formatINR } from "@/lib/utils"
import { useToast } from "@/components/toast"
import ThemeToggle from "@/components/theme-toggle"

type ClientData = {
  client_name: string
  client_email: string
  client_phone: string
  client_address: string
  quote_count: number
  total_value: number
  last_quote_date: string
  quote_statuses: { sent: number; accepted: number; lost: number; draft: number }
}

export default function ClientsClient() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "value" | "recent">("recent")
  const loadRef = useRef<(() => void) | null>(null)

  const loadClients = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data: quotes } = await supabase
      .from("quotes")
      .select("client_name, client_email, client_phone, client_address, status, total, created_at")
      .eq("user_id", user.id)
      .not("client_name", "is", null)
      .order("created_at", { ascending: false })

    const clientMap = new Map<string, ClientData>()

    ;(quotes || []).forEach(q => {
      const name = q.client_name?.trim() || "Unknown"
      if (!name) return

      if (!clientMap.has(name)) {
        clientMap.set(name, {
          client_name: name,
          client_email: q.client_email || "",
          client_phone: q.client_phone || "",
          client_address: q.client_address || "",
          quote_count: 0,
          total_value: 0,
          last_quote_date: q.created_at,
          quote_statuses: { sent: 0, accepted: 0, lost: 0, draft: 0 },
        })
      }

      const client = clientMap.get(name)!
      client.quote_count++
      client.total_value += Number(q.total) || 0
      if (new Date(q.created_at) > new Date(client.last_quote_date)) {
        client.last_quote_date = q.created_at
      }
      const status = q.status as keyof typeof client.quote_statuses
      if (status in client.quote_statuses) {
        client.quote_statuses[status as keyof typeof client.quote_statuses]++
      }
    })

    setClients(Array.from(clientMap.values()))
    setLoading(false)
  }, [supabase, router])

  loadRef.current = loadClients
  useEffect(() => { loadRef.current?.() }, [])

  const filteredClients = search.trim()
    ? clients.filter(c =>
        c.client_name.toLowerCase().includes(search.toLowerCase()) ||
        c.client_email?.toLowerCase().includes(search.toLowerCase()) ||
        c.client_phone?.includes(search)
      )
    : clients

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === "name") return a.client_name.localeCompare(b.client_name)
    if (sortBy === "value") return b.total_value - a.total_value
    return new Date(b.last_quote_date).getTime() - new Date(a.last_quote_date).getTime()
  })

  const totalClients = clients.length
  const totalRevenue = clients.reduce((s, c) => s + c.total_value, 0)
  const totalQuotes = clients.reduce((s, c) => s + c.quote_count, 0)
  const acceptedQuotes = clients.reduce((s, c) => s + c.quote_statuses.accepted, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="skeleton h-8 w-48" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-900 tracking-tight">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#4F46E5" />
                <path d="M10 10h12M10 16h8M10 22h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M22 18l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              SendQuote
            </Link>
            <span className="text-sm text-slate-500">Clients</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">Dashboard</Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
            <p className="text-sm text-slate-500 mt-0.5">{totalClients} clients • {totalQuotes} quotes • {acceptedQuotes} accepted</p>
          </div>
          <Link href="/quote/new" className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
            + New Quote
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Clients</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalClients}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatINR(totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg. Quote Value</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{totalQuotes > 0 ? formatINR(totalRevenue / totalQuotes) : formatINR(0)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search clients by name, email or phone..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as "name" | "value" | "recent")}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="value">Highest Value</option>
              </select>
            </div>
          </div>

          {sortedClients.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <p className="text-slate-600 font-medium">No clients found</p>
              <p className="text-sm text-slate-400 mt-1">{search ? "Try a different search term" : "Create quotes to see your clients here"}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {sortedClients.map((client, i) => (
                <div
                  key={client.client_name}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-indigo-600">
                          {client.client_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{client.client_name}</p>
                        <div className="flex gap-2 text-xs text-slate-500">
                          {client.client_email && <span>{client.client_email}</span>}
                          {client.client_phone && <span>• {client.client_phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatINR(client.total_value)}</p>
                        <p className="text-xs text-slate-500">{client.quote_count} quotes</p>
                      </div>
                      <div className="flex gap-1">
                        {client.quote_statuses.accepted > 0 && (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700" title={`${client.quote_statuses.accepted} accepted`}>
                            {client.quote_statuses.accepted}
                          </span>
                        )}
                        {client.quote_statuses.sent > 0 && (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700" title={`${client.quote_statuses.sent} sent`}>
                            {client.quote_statuses.sent}
                          </span>
                        )}
                        {client.quote_statuses.lost > 0 && (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-500" title={`${client.quote_statuses.lost} lost`}>
                            {client.quote_statuses.lost}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          Clients are automatically created from your quotes. Create more quotes to grow your client list.
        </p>
      </main>
    </div>
  )
}