"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { CardSkeleton, TableSkeleton } from "@/components/skeleton"
import { useToast } from "@/components/toast"
import Sidebar from "@/components/sidebar"
import Breadcrumbs from "@/components/breadcrumbs"
import CommandPalette from "@/components/command-palette"
import ThemeToggle from "@/components/theme-toggle"
import UserOnboarding from "@/components/user-onboarding"
import UserTour from "@/components/user-tour"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

type Quote = {
  id: string
  quote_number: string
  client_name: string
  total: number
  status: string
  created_at: string
  unique_token: string
  valid_till?: string
}

const PAGE_SIZE = 25
const FREE_PLAN_LIMIT = 5

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 299,
  professional: 799,
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; value: number }; value: number }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        <p className="font-medium">{payload[0].payload.label}</p>
        <p className="text-slate-300">{payload[0].value} quotes</p>
        <p className="text-emerald-400">₹{(payload[0].payload.value / 1000).toFixed(1)}k</p>
      </div>
    )
  }
  return null
}

export default function DashboardClient() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [allQuotes, setAllQuotes] = useState<Quote[]>([])
  const [profile, setProfile] = useState<{ business_name: string; plan: string } | null>(null)
  const [monthCount, setMonthCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [hasMore, setHasMore] = useState(true)
  const [monthlyData, setMonthlyData] = useState<{ label: string; count: number; value: number }[]>([])
  const [dateRange, setDateRange] = useState({ from: "", to: "" })
  const [clientFilter, setClientFilter] = useState("all")
  const [clients, setClients] = useState<{ client_name: string }[]>([])
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([])
  const [outstanding, setOutstanding] = useState(0)
  const [overdue, setOverdue] = useState(0)
  const [showUpgradePopup, setShowUpgradePopup] = useState(false)
  const [popupDismissed, setPopupDismissed] = useState(false)
  const [recentlyDeleted, setRecentlyDeleted] = useState<{ id: string; quote_number: string }[]>([])
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [analytics, setAnalytics] = useState({ winRate: 0, avgValue: 0, topClient: "", topClientValue: 0 })
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const chartPrimary = "#4f46e5"
  const chartSecondary = "#c7d2fe"

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data: prof } = await supabase
      .from("profiles")
      .select("business_name, plan")
      .eq("user_id", user.id)
      .single()
    setProfile(prof)

    if (prof?.plan === "free" && !popupDismissed) {
      const stored = sessionStorage.getItem("qs_popup_shown")
      if (!stored && !showUpgradePopup) {
        sessionStorage.setItem("qs_popup_shown", "1")
      }
    }

    if (prof?.plan === "free") {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      const { count } = await supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", monthStart.toISOString())
      setMonthCount(count || 0)
    }

    const { data: clientData } = await supabase
      .from("quotes")
      .select("client_name")
      .eq("user_id", user.id)
      .not("client_name", "is", null)
    const uniqueClients = [...new Set((clientData || []).map(c => c.client_name))]
    setClients(uniqueClients.map(c => ({ client_name: c })))

    let query = supabase
      .from("quotes")
      .select("id, quote_number, client_name, total, status, created_at, unique_token, valid_till", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1)

    if (filter !== "all") query = query.eq("status", filter)
    if (clientFilter !== "all") query = query.eq("client_name", clientFilter)
    if (dateRange.from) query = query.gte("created_at", dateRange.from)
    if (dateRange.to) query = query.lte("created_at", dateRange.to + "T23:59:59")

    const { data: qs, count: totalCount } = await query
    const loaded = (qs as Quote[]) || []
    setQuotes(loaded)
    setAllQuotes(loaded)
    setHasMore(loaded.length === PAGE_SIZE && (totalCount || 0) > PAGE_SIZE)

    const out = loaded.filter(q => q.status === "sent" || q.status === "opened").reduce((s, q) => s + Number(q.total), 0)
    setOutstanding(out)
    const now = new Date()
    const expiredIds = loaded
      .filter(q => q.status === "sent" && q.valid_till && new Date(q.valid_till) < now)
      .map(q => q.id)
    if (expiredIds.length > 0) {
      await supabase.from("quotes").update({ status: "expired" }).in("id", expiredIds)
    }
    const over = loaded.filter(q => (q.status === "sent" || q.status === "opened") && q.valid_till && new Date(q.valid_till) < now).reduce((s, q) => s + Number(q.total), 0)
    setOverdue(over)

    // Analytics - Win Rate & Top Client
    const totalSent = loaded.filter(q => ['sent', 'opened', 'accepted', 'changes_requested', 'expired', 'lost'].includes(q.status)).length
    const accepted = loaded.filter(q => q.status === 'accepted').length
    const winRate = totalSent > 0 ? Math.round((accepted / totalSent) * 100) : 0
    
    const avgValue = loaded.length > 0 ? Math.round(loaded.reduce((s, q) => s + Number(q.total), 0) / loaded.length) : 0
    
    // Top client by value
    const clientValues: Record<string, number> = {}
    loaded.forEach(q => {
      if (q.client_name) {
        clientValues[q.client_name] = (clientValues[q.client_name] || 0) + Number(q.total)
      }
    })
    const topClient = Object.entries(clientValues).sort((a, b) => b[1] - a[1])[0]
    
    setAnalytics({
      winRate,
      avgValue,
      topClient: topClient?.[0] || "",
      topClientValue: topClient?.[1] || 0
    })

    const months: { start: Date; label: string }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      months.push({ start: new Date(d.getFullYear(), d.getMonth(), 1), label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) })
    }
    const chartQuery = await supabase.from("quotes").select("created_at, total").eq("user_id", user.id).gte("created_at", months[0].start.toISOString())
    const chartData = months.map(m => {
      const next = new Date(m.start); next.setMonth(next.getMonth() + 1)
      const inMonth = (chartQuery.data || []).filter(q => {
        const d = new Date(q.created_at); return d >= m.start && d < next
      })
      return { label: m.label, count: inMonth.length, value: inMonth.reduce((s, q) => s + Number(q.total), 0) }
    })
    setMonthlyData(chartData)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, clientFilter, dateRange, router, supabase])

  useEffect(() => { loadData() }, [loadData])

  // Realtime subscription for quote updates
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-quotes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, (payload) => {
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadData])

  async function loadMore() {
    setLoadingMore(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from("quotes")
      .select("id, quote_number, client_name, total, status, created_at, unique_token")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(allQuotes.length, allQuotes.length + PAGE_SIZE - 1)

    if (filter !== "all") query = query.eq("status", filter)

    const { data: qs } = await query
    const more = (qs as Quote[]) || []
    const updated = [...allQuotes, ...more]
    setAllQuotes(updated)
    setQuotes(updated)
    setHasMore(more.length === PAGE_SIZE)
    setLoadingMore(false)
  }

  async function handleDuplicate(quote: Quote, e: React.MouseEvent) {
    e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (profile?.plan === "free" && monthCount >= FREE_PLAN_LIMIT) {
      toast(`Free plan limit reached (${FREE_PLAN_LIMIT}/month). Upgrade to create more.`, "error")
      return
    }

    const { data: original } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quote.id)
      .single()

    if (!original) { toast("Failed to load original quote", "error"); return }

    const nanoid = (await import("nanoid")).nanoid
    const token = nanoid(12)
    const { count: countData } = await supabase
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
    const nextNum = (countData || 0) + 1
    const quoteNumber = `QS-${String(nextNum).padStart(3, "0")}`

    const { data: newQuote, error } = await supabase.from("quotes").insert({
      user_id: user.id,
      quote_number: quoteNumber,
      unique_token: token,
      client_name: original.client_name,
      client_address: original.client_address,
      client_phone: original.client_phone,
      client_email: original.client_email,
      subtotal: original.subtotal,
      discount: original.discount,
      discount_type: original.discount_type,
      gst_rate: original.gst_rate,
      gst_amount: original.gst_amount,
      total: original.total,
      terms: original.terms,
      notes: original.notes,
      status: "draft",
    }).select("id").single()

    if (error) { toast(error.message, "error"); return }

    const { data: originalItems } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quote.id)
      .order("sort_order")

    if (originalItems && originalItems.length > 0) {
      const { error: itemsErr } = await supabase.from("quote_items").insert(
        originalItems.map((item: any, i: number) => ({
          quote_id: newQuote.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: item.amount,
          sort_order: i,
        }))
      )
      if (itemsErr) toast(itemsErr.message, "error")
    }

    toast("Quote duplicated as draft!", "success")
    loadData()
  }

  function exportCSV() {
    const rows = [["Quote #", "Client", "Amount", "Status", "Date"].join(",")]
    filteredQuotes.forEach(q => {
      rows.push([
        q.quote_number,
        `"${q.client_name}"`,
        Number(q.total).toFixed(2),
        q.status,
        new Date(q.created_at).toLocaleDateString("en-IN"),
      ].join(","))
    })
    const bom = "\uFEFF"
    const blob = new Blob([bom + rows.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `quotes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  function toggleSelectAll() {
    if (selectedQuotes.length === filteredQuotes.length) {
      setSelectedQuotes([])
    } else {
      setSelectedQuotes(filteredQuotes.map(q => q.id))
    }
  }

  function toggleSelect(id: string) {
    setSelectedQuotes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedQuotes.length} selected quotes? This cannot be undone.`)) return
    const toDelete = allQuotes.filter(q => selectedQuotes.includes(q.id))
    setRecentlyDeleted(toDelete.map(q => ({ id: q.id, quote_number: q.quote_number })))
    setTimeout(() => setRecentlyDeleted([]), 30000)
    const { error } = await supabase.from("quotes").delete().in("id", selectedQuotes)
    if (error) toast(error.message, "error")
    else { toast(`Deleted ${selectedQuotes.length} quotes. Undo available for 30s.`, "success"); setSelectedQuotes([]); loadData() }
  }

  async function undoDelete() {
    if (recentlyDeleted.length === 0) return
    for (const q of recentlyDeleted) {
      await supabase.from("quotes").update({ status: "draft" }).eq("id", q.id)
    }
    toast("Quotes restored!", "success")
    setRecentlyDeleted([])
    loadData()
  }

  async function bulkUpdateStatus(status: string) {
    if (selectedQuotes.length === 0) return
    const { error } = await supabase.from("quotes").update({ status, updated_at: new Date().toISOString() }).in("id", selectedQuotes)
    if (error) toast(error.message, "error")
    else { toast(`Updated to ${status.replace("_", " ")}`, "success"); setSelectedQuotes([]); loadData() }
  }

  function clearFilters() {
    setFilter("all")
    setSearch("")
    setDateRange({ from: "", to: "" })
    setClientFilter("all")
  }

  const hasActiveFilters = filter !== "all" || search || dateRange.from || dateRange.to || clientFilter !== "all"

  async function handleLogout() {
    if (!confirm("Are you sure you want to sign out? Your current work is saved automatically.")) return
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  function exportJSON() {
    const data = filteredQuotes.map(q => ({
      quote_number: q.quote_number,
      client_name: q.client_name,
      total: q.total,
      status: q.status,
      created_at: q.created_at,
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `quotes-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  const filteredQuotes = search.trim()
    ? quotes.filter(quote =>
        quote.client_name.toLowerCase().includes(search.toLowerCase()) ||
        quote.quote_number.toLowerCase().includes(search.toLowerCase())
      )
    : quotes

  const totalValue = filteredQuotes.reduce((s, q) => s + Number(q.total), 0)
  const accepted = filteredQuotes.filter(q => q.status === "accepted").length
  const acceptanceRate = filteredQuotes.length > 0 ? Math.round((accepted / filteredQuotes.length) * 100) : 0

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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
            </div>
            <TableSkeleton rows={6} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <UserTour />
      <Sidebar />
      <CommandPalette />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Breadcrumbs />
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="lg:hidden flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.dispatchEvent(new Event("toggle-command-palette"))}
                className="hidden md:flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <span className="text-xs">Search</span>
                <kbd className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">⌘K</kbd>
              </button>

              <ThemeToggle />
              <Link href="/settings" className="text-sm text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-6 py-8 space-y-6 animate-fade-in overflow-y-auto">
          {recentlyDeleted.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between animate-fade-in">
              <span className="text-sm text-amber-800">{recentlyDeleted.length} quote(s) deleted</span>
              <button onClick={undoDelete} className="text-xs font-medium text-amber-700 hover:text-amber-900 underline">Undo</button>
            </div>
          )}
          {profile?.plan === "free" && (
            <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-3 mb-1.5">
                  <span className="text-sm font-medium text-slate-700">Free Plan</span>
                  <span className="text-sm text-slate-500">
                    {monthCount} / {FREE_PLAN_LIMIT} quotes used
                  </span>
                </div>
                <div className="w-full sm:w-64 bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      monthCount >= FREE_PLAN_LIMIT ? "bg-red-400" : "bg-indigo-500"
                    }`}
                    style={{ width: `${Math.min((monthCount / FREE_PLAN_LIMIT) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <Link
                href="/upgrade"
                className="shrink-0 text-sm font-medium bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                Upgrade — ₹{PLAN_PRICES.starter}/month
              </Link>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">At a Glance</h2>
              <p className="text-sm text-slate-500">Quick overview of your quote activity</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger">
              {[
                { label: "Total Quotes", value: filteredQuotes.length, color: "from-indigo-500 to-indigo-600" },
                { label: "Total Value", value: `₹${totalValue.toLocaleString("en-IN")}`, color: "from-emerald-500 to-emerald-600" },
                { label: "Accepted", value: accepted, color: "from-violet-500 to-violet-600" },
                { label: "Acceptance Rate", value: `${acceptanceRate}%`, color: "from-amber-500 to-amber-600" },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 card-hover">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                  <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mt-1.5`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Quote CTA */}
          <Link href="/quote/voice" className="block">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white hover:shadow-xl hover:shadow-indigo-900/20 transition-all hover:scale-[1.01] active:scale-[0.99]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">New Feature</p>
                  <h3 className="text-lg font-bold mb-1">Create Quote by Voice</h3>
                  <p className="text-sm text-white/70">No typing needed — just speak. Supports Hindi, English, Tamil & more.</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="white" strokeWidth="1.5"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="1.5"/>
                    <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="1.5"/>
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Financial Summary</h3>
              <p className="text-xs text-slate-500 mb-4">Outstanding amounts and overdue payments</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-700">Outstanding</span>
                  </div>
                  <span className="text-lg font-bold text-orange-700">₹{outstanding.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-700">Overdue</span>
                  </div>
                  <span className="text-lg font-bold text-red-700">₹{overdue.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {monthlyData.some(d => d.count > 0) && (
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Monthly Activity</h3>
                <p className="text-xs text-slate-500 mb-4">Quotes created over the last 6 months</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {monthlyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === monthlyData.length - 1 ? chartPrimary : chartSecondary} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 space-y-3">
              {selectedQuotes.length > 0 && (
                <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2 animate-fade-in">
                  <span className="text-sm font-medium text-indigo-700">{selectedQuotes.length} selected</span>
                  <div className="flex gap-2">
                    <button onClick={() => bulkUpdateStatus("draft")} className="text-xs text-slate-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-white">Mark Draft</button>
                    <button onClick={() => bulkUpdateStatus("sent")} className="text-xs text-slate-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-white">Mark Sent</button>
                    <button onClick={() => bulkUpdateStatus("accepted")} className="text-xs text-slate-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-white">Mark Accepted</button>
                    <button onClick={() => bulkUpdateStatus("archived")} className="text-xs text-slate-600 hover:text-slate-700 px-2 py-1 rounded hover:bg-white">Archive</button>
                    <button onClick={bulkDelete} className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-white font-medium">Delete</button>
                  </div>
                </div>
              )}
              
              <div className={`${showFilterPanel ? 'block' : 'hidden'} lg:block`}>
                <div className="flex items-center justify-between overflow-x-auto gap-2 mb-3">
                  <div className="flex gap-1.5">
                    {["all", "draft", "sent", "opened", "accepted", "changes_requested", "expired", "lost", "archived"].map(s => (
                      <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`text-xs whitespace-nowrap px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                          filter === s
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:inline">{filteredQuotes.length} total</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search by client name or quote number..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                    />
                  </div>
                  <select
                    value={clientFilter}
                    onChange={e => setClientFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="all">All Clients</option>
                    {clients.map(c => (
                      <option key={c.client_name} value={c.client_name}>{c.client_name}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="To"
                  />
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-2">
                      Clear
                    </button>
                  )}
                  {filteredQuotes.length > 0 && (
                    <>
                      <button onClick={exportCSV} title="Export to CSV"
                        className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        CSV
                      </button>
                      <button onClick={exportJSON} title="Export all data as JSON"
                        className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-1.5">
                        JSON
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {filteredQuotes.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium mb-1">
                  {search ? "No matches found" : "No quotes yet"}
                </p>
                <p className="text-sm text-slate-400 mb-6">
                  {search ? "Try a different search term" : "Create your first quote and share it with a client"}
                </p>
                {!search && (
                  <Link
                    href="/quote/new"
                    className="inline-flex bg-indigo-600 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Create Your First Quote
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-3.5 w-8">
                        <input type="checkbox" checked={selectedQuotes.length === filteredQuotes.length && filteredQuotes.length > 0} onChange={toggleSelectAll} className="rounded border-slate-300" />
                      </th>
                      <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Quote</th>
                      <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Client</th>
                      <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider hidden sm:table-cell">Date</th>
                      <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotes.map((q, i) => {
                      const statusStyle = statusStyles[q.status] || statusStyles.draft
                      return (
                        <tr
                          key={q.id}
                          className="border-b border-slate-50 hover:bg-slate-50 transition-colors group animate-fade-in"
                          style={{ animationDelay: `${i * 0.03}s` }}
                        >
                          <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={selectedQuotes.includes(q.id)} onChange={() => toggleSelect(q.id)} className="rounded border-slate-300" />
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-900 cursor-pointer" onClick={() => router.push(`/quote/${q.id}`)}>{q.quote_number}</td>
                          <td className="px-4 py-3.5 text-slate-700 cursor-pointer" onClick={() => router.push(`/quote/${q.id}`)}>{q.client_name}</td>
                          <td className="px-4 py-3.5 font-medium text-slate-900 cursor-pointer" onClick={() => router.push(`/quote/${q.id}`)}>
                            ₹{Number(q.total).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3.5 cursor-pointer" onClick={() => router.push(`/quote/${q.id}`)}>
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full capitalize ${statusStyle.bg} ${statusStyle.text}`}>
                              {statusStyle.icon}
                              {q.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 hidden sm:table-cell cursor-pointer" onClick={() => router.push(`/quote/${q.id}`)}>
                            {new Date(q.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={e => handleDuplicate(q, e)}
                                title="Duplicate quote"
                                className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                </svg>
                              </button>
                              <Link
                                href={`/quote/${q.id}`}
                                className="text-indigo-600 hover:text-indigo-700 text-xs font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 transition-all"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {hasMore && (
              <div className="p-4 text-center border-t border-slate-100">
                <button onClick={loadMore} disabled={loadingMore}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 px-5 py-2 rounded-lg hover:bg-indigo-50 transition-all disabled:opacity-50">
                  {loadingMore ? "Loading..." : `Load More (${allQuotes.length} loaded)`}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {profile?.plan === "free" && !popupDismissed && (
        <UpgradePopup onDismiss={() => setPopupDismissed(true)} />
      )}
      <UserOnboarding />
    </div>
  )
}

function UpgradePopup({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const messages = [
    "Professional quotes get accepted more often. Ready to upgrade?",
    "Starter gives you unlimited quotes, open tracking, and branded PDFs.",
    "Track when clients open your quote and follow up at the right moment.",
  ]

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 8000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setStep(prev => prev >= 2 ? 2 : prev + 1)
    }, 4000)
    return () => clearInterval(interval)
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onDismiss} />
      <div className="relative bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-slate-200 animate-fade-in-scale">
        <button onClick={onDismiss} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unlock Your Full Potential</h2>
          <p className="text-sm text-slate-500 min-h-[40px] transition-all">
            {messages[step]}
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">What you get with Starter</p>
          {["Unlimited quotes", "Open tracking", "Branded PDF with logo", "WhatsApp sharing", "Client accept online", "Auto follow-ups"].map(f => (
            <div key={f} className="flex items-center gap-2.5 py-1 text-sm text-slate-700">
              <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {f}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            Maybe Later
          </button>
          <Link href="/upgrade"
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">
            Upgrade — ₹299/mo
          </Link>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-4">7-day free trial. No credit card required.</p>
      </div>
    </div>
  )
}