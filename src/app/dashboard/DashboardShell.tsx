"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { sanitizeInput } from "@/lib/sanitize"
import { checkQuota, incrementQuoteCount } from "@/lib/plan"
import { CardSkeleton, TableSkeleton } from "@/components/skeleton"
import { useToast } from "@/components/toast"
import Sidebar from "@/components/sidebar"
import Breadcrumbs from "@/components/breadcrumbs"
import CommandPalette from "@/components/command-palette"
import UserOnboarding from "@/components/user-onboarding"
import UserTour from "@/components/user-tour"
import ThemeToggle from "@/components/theme-toggle"
import StatsCards from "./StatsCards"
import MonthlyChart from "./MonthlyChart"
import QuoteTable from "./QuoteTable"

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

type DashboardShellProps = {
  initialQuotes: Quote[]
  initialProfile: { business_name: string; plan: string; voice_enabled?: boolean; voice_language?: string; tts_rate?: number; upi_id?: string; smtp_email?: string } | null
  initialStats: { total_quotes: number; total_value: number; accepted: number; outstanding: number; overdue: number; month_count: number }
  monthlyData: { label: string; count: number; value: number }[]
  clients: string[]
  userId: string
}

const PAGE_SIZE = 25
const FREE_PLAN_LIMIT = 5
const PLAN_PRICES: Record<string, number> = { free: 0, starter: 299, professional: 799 }

export default function DashboardShell({ initialQuotes, initialProfile, initialStats, monthlyData, clients, userId }: DashboardShellProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes)
  const [allQuotes, setAllQuotes] = useState<Quote[]>(initialQuotes)
  const [profile, setProfile] = useState(initialProfile)
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [hasMore, setHasMore] = useState(initialQuotes.length === PAGE_SIZE)
  const [dateRange, setDateRange] = useState({ from: "", to: "" })
  const [clientFilter, setClientFilter] = useState("all")
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([])
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showUpgradePopup, setShowUpgradePopup] = useState(false)
  const [popupDismissed, setPopupDismissed] = useState(false)
  const [referralCount, setReferralCount] = useState(0)
  const [sortKey, setSortKey] = useState<string>("created_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const router = useRouter()
  const supabase = createClient()
  const { toast, toastWithUndo } = useToast()

  useEffect(() => {
    const loadReferrals = async () => {
      const { count } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("referrer_id", userId)
      setReferralCount(count || 0)
    }
    loadReferrals()
  }, [supabase, userId])

  useEffect(() => {
    if (profile?.plan === "free" && !popupDismissed) {
      const stored = sessionStorage.getItem("qs_popup_shown")
      if (!stored && !showUpgradePopup) {
        sessionStorage.setItem("qs_popup_shown", "1")
      }
    }
  }, [profile, popupDismissed, showUpgradePopup])

  const loadData = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from("quotes")
      .select("id, quote_number, client_name, total, status, created_at, unique_token, valid_until", { count: "exact" })
      .eq("user_id", userId)
      .eq("is_deleted", false)

    if (filter !== "all") query = query.eq("status", filter)
    if (clientFilter !== "all") query = query.eq("client_name", clientFilter)
    if (dateRange.from) query = query.gte("created_at", dateRange.from)
    if (dateRange.to) query = query.lte("created_at", dateRange.to + "T23:59:59")
    if (search.trim()) {
      const s = search.trim()
      query = query.or(`client_name.ilike.%${s}%,quote_number.ilike.%${s}%`)
    }

    query = query.order(sortKey as keyof Quote, { ascending: sortDir === "asc" })
    query = query.range(0, PAGE_SIZE - 1)

    const { data: qs, count: totalCount } = await query
    const loaded = (qs as Quote[]) || []
    setQuotes(loaded)
    setAllQuotes(loaded)
    setHasMore(loaded.length === PAGE_SIZE && (totalCount || 0) > PAGE_SIZE)
    setLoading(false)
  }, [filter, clientFilter, dateRange, search, sortKey, sortDir, supabase, userId])

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-quotes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => { loadData() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, loadData])

  async function loadMore() {
    setLoadingMore(true)
    let query = supabase
      .from("quotes")
      .select("id, quote_number, client_name, total, status, created_at, unique_token")
      .eq("user_id", userId)
      .eq("is_deleted", false)

    if (filter !== "all") query = query.eq("status", filter)
    if (clientFilter !== "all") query = query.eq("client_name", clientFilter)
    if (dateRange.from) query = query.gte("created_at", dateRange.from)
    if (dateRange.to) query = query.lte("created_at", dateRange.to + "T23:59:59")
    if (search.trim()) {
      const s = search.trim()
      query = query.or(`client_name.ilike.%${s}%,quote_number.ilike.%${s}%`)
    }

    query = query.order(sortKey as keyof Quote, { ascending: sortDir === "asc" })
    query = query.range(allQuotes.length, allQuotes.length + PAGE_SIZE - 1)

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
    const quota = await checkQuota(userId, 'quote')
    if (!quota.allowed) { toast("Free plan: 3 quotes/month. Upgrade for ₹299.", "error"); return }

    const { data: original } = await supabase.from("quotes").select("*").eq("id", quote.id).single()
    if (!original) { toast("Failed to load original quote", "error"); return }

    const nanoid = (await import("nanoid")).nanoid
    const token = nanoid(12)
    const { data: numData } = await supabase.rpc('next_quote_number', { p_user_id: userId })
    const quoteNumber = numData as string

    const { data: newQuote, error } = await supabase.from("quotes").insert({
      user_id: userId,
      quote_number: quoteNumber,
      unique_token: token,
      client_name: sanitizeInput(original.client_name),
      client_address: sanitizeInput(original.client_address),
      client_phone: sanitizeInput(original.client_phone),
      client_email: sanitizeInput(original.client_email),
      subtotal: original.subtotal,
      discount: original.discount,
      discount_type: original.discount_type,
      gst_rate: original.gst_rate,
      gst_amount: original.gst_amount,
      total: original.total,
      terms: sanitizeInput(original.terms),
      notes: sanitizeInput(original.notes),
      status: "draft",
    }).select("id").single()

    if (error) { toast(error.message, "error"); return }

    const { data: originalItems } = await supabase.from("quote_items").select("*").eq("quote_id", quote.id).order("sort_order")
    if (originalItems && originalItems.length > 0) {
      const { error: itemsErr } = await supabase.from("quote_items").insert(
        originalItems.map((item: { description: string; spec?: string; quantity: number; unit: string; rate: number; amount: number }, i: number) => ({
          quote_id: newQuote.id,
          description: sanitizeInput(item.description),
          spec: item.spec || '',
          quantity: item.quantity,
          unit: sanitizeInput(item.unit),
          rate: item.rate,
          amount: item.amount,
          sort_order: i,
        }))
      )
      if (itemsErr) toast(itemsErr.message, "error")
    }

    await incrementQuoteCount(userId)
    toast("Quote duplicated as draft!", "success")
    loadData()
  }

  function toggleSelectAll() {
    if (selectedQuotes.length === quotes.length) {
      setSelectedQuotes([])
    } else {
      setSelectedQuotes(quotes.map(q => q.id))
    }
  }

  function toggleSelect(id: string) {
    setSelectedQuotes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedQuotes.length} selected quotes?`)) return
    const toDelete = allQuotes.filter(q => selectedQuotes.includes(q.id))
    const { error } = await supabase.from("quotes").update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    }).in("id", selectedQuotes)
    if (error) toast(error.message, "error")
    else {
      toastWithUndo(`Deleted ${selectedQuotes.length} quotes`, async () => {
        for (const q of toDelete) {
          await supabase.from("quotes").update({
            is_deleted: false,
            deleted_at: null,
          }).eq("id", q.id)
        }
        loadData()
      })
      setSelectedQuotes([])
      loadData()
    }
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
    setSortKey("created_at")
    setSortDir("desc")
  }

  async function handleLogout() {
    if (!confirm("Are you sure you want to sign out? Your current work is saved automatically.")) return
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  function exportCSV() {
    const rows = [["Quote #", "Client", "Amount", "Status", "Date"].join(",")]
    quotes.forEach(q => {
      rows.push([q.quote_number, `"${q.client_name}"`, Number(q.total).toFixed(2), q.status, new Date(q.created_at).toLocaleDateString("en-IN")].join(","))
    })
    const bom = "\uFEFF"
    const blob = new Blob([bom + rows.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `quotes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  function exportJSON() {
    const data = quotes.map(q => ({ quote_number: q.quote_number, client_name: q.client_name, total: q.total, status: q.status, created_at: q.created_at }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `quotes-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  async function exportAll() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast("Please sign in to export", "error"); return }
      const res = await fetch("/api/export-all", { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!res.ok) { toast("Export failed", "error"); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = `sendquote-export-${new Date().toISOString().slice(0, 10)}.zip`
      a.click(); URL.revokeObjectURL(url)
      toast("Full export downloaded!", "success")
    } catch { toast("Export failed", "error") }
  }

  const hasActiveFilters = filter !== "all" || search || dateRange.from || dateRange.to || clientFilter !== "all"

  const totalValue = quotes.reduce((s, q) => s + Number(q.total), 0)
  const accepted = quotes.filter(q => q.status === "accepted").length
  const acceptanceRate = quotes.length > 0 ? Math.round((accepted / quotes.length) * 100) : 0

  function handleQuickFilter(chip: string) {
    const now = new Date()
    switch (chip) {
      case "This Week": {
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
        setDateRange({ from: weekStart.toISOString().split("T")[0], to: "" })
        setFilter("all")
        break
      }
      case "This Month": {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        setDateRange({ from: monthStart.toISOString().split("T")[0], to: "" })
        setFilter("all")
        break
      }
      case "Pending":
        setFilter("sent")
        setDateRange({ from: "", to: "" })
        break
      case "Accepted":
        setFilter("accepted")
        setDateRange({ from: "", to: "" })
        break
      case "Overdue":
        setFilter("sent")
        setDateRange({ from: "", to: now.toISOString().split("T")[0] })
        break
      default:
        clearFilters()
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <UserTour />
      <Sidebar />
      <CommandPalette />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Breadcrumbs />
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="lg:hidden flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {hasActiveFilters && <span className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.dispatchEvent(new Event("toggle-command-palette"))}
                className="hidden md:flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <span className="text-xs">Search</span>
                <kbd className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">⌘K</kbd>
              </button>
              <ThemeToggle />
              <Link href="/settings" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              <button onClick={handleLogout} className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-6 py-8 space-y-6 animate-fade-in overflow-y-auto">
          {profile?.plan === "free" && (
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-3 mb-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Free Plan</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{stats.month_count} / {FREE_PLAN_LIMIT} quotes used</span>
                </div>
                <div className="w-full sm:w-64 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${stats.month_count >= FREE_PLAN_LIMIT ? "bg-red-400 dark:bg-red-500" : "bg-indigo-500 dark:bg-indigo-400"}`}
                    style={{ width: `${Math.min((stats.month_count / FREE_PLAN_LIMIT) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <Link href="/upgrade" className="shrink-0 text-sm font-medium bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
                Upgrade — ₹{PLAN_PRICES.starter}/month
              </Link>
            </div>
          )}

          {referralCount > 0 && (
            <Link href="/settings" className="block">
              <div className="bg-gradient-to-r from-emerald-50 dark:from-emerald-950/30 to-teal-50 dark:to-teal-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/50 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{referralCount} referral{referralCount > 1 ? "s" : ""}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">Click to manage your referral link</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-emerald-400 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            </Link>
          )}

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

          <StatsCards
            stats={{
              total_quotes: quotes.length,
              total_value: totalValue,
              accepted,
              acceptance_rate: acceptanceRate,
              outstanding: stats.outstanding,
              overdue: stats.overdue,
            }}
          />

          {monthlyData.some(d => d.count > 0) && <MonthlyChart data={monthlyData} />}

          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 space-y-3">
              {selectedQuotes.length > 0 && (
                <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/30 rounded-lg px-3 py-2 animate-fade-in">
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{selectedQuotes.length} selected</span>
                  <div className="flex gap-2">
                    <button onClick={() => bulkUpdateStatus("draft")} className="text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-700">Mark Draft</button>
                    <button onClick={() => bulkUpdateStatus("sent")} className="text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-700">Mark Sent</button>
                    <button onClick={() => bulkUpdateStatus("accepted")} className="text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-700">Mark Accepted</button>
                    <button onClick={() => bulkUpdateStatus("archived")} className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-700">Archive</button>
                    <button onClick={bulkDelete} className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-700 font-medium">Delete</button>
                  </div>
                </div>
              )}

              <div className={`${showFilterPanel ? 'block' : 'hidden'} lg:block`}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {["This Week", "This Month", "Pending", "Accepted", "Overdue"].map(chip => (
                    <button
                      key={chip}
                      onClick={() => handleQuickFilter(chip)}
                      className={`text-xs whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition-all ${
                        (chip === "This Week" && dateRange.from && !dateRange.to && filter === "all") ||
                        (chip === "This Month" && dateRange.from && !dateRange.to && filter === "all") ||
                        (chip === "Pending" && filter === "sent" && !dateRange.from) ||
                        (chip === "Accepted" && filter === "accepted") ||
                        (chip === "Overdue" && filter === "sent" && dateRange.to)
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto hidden sm:inline">{quotes.length} total</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search by client name or quote number..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-300 dark:focus:border-indigo-600 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <select
                    value={clientFilter}
                    onChange={e => setClientFilter(e.target.value)}
                    className="text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
                  >
                    <option value="all">All Clients</option>
                    {clients.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
                    placeholder="To"
                  />
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-2">Clear</button>
                  )}
                  {quotes.length > 0 && (
                    <>
                      <button onClick={exportCSV} title="Export to CSV"
                        className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        CSV
                      </button>
                      <button onClick={exportJSON} title="Export all data as JSON"
                        className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5">
                        JSON
                      </button>
                      <button onClick={exportAll} title="Full data export (ZIP)"
                        className="shrink-0 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M3.75 7.5h16.5M3.75 7.5v-3a2.25 2.25 0 012.25-2.25h12A2.25 2.25 0 0120.25 4.5v3" />
                        </svg>
                        Full Export
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <QuoteTable
              quotes={quotes}
              selectedQuotes={selectedQuotes}
              onSelect={toggleSelect}
              onSelectAll={toggleSelectAll}
              onDuplicate={handleDuplicate}
              onView={(q) => router.push(`/quote/${q.id}`)}
            />

            {hasMore && (
              <div className="p-4 text-center border-t border-slate-100 dark:border-slate-700">
                <button onClick={loadMore} disabled={loadingMore}
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-5 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all disabled:opacity-50">
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
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onDismiss} />
      <div className="relative bg-white dark:bg-slate-800/50 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in-scale">
        <button onClick={onDismiss} className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 dark:from-amber-950/30 to-amber-50 dark:to-amber-950/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Unlock Your Full Potential</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 min-h-[40px] transition-all">{messages[step]}</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">What you get with Starter</p>
          {["Unlimited quotes", "Open tracking", "Branded PDF with logo", "WhatsApp sharing", "Client accept online", "Auto follow-ups"].map(f => (
            <div key={f} className="flex items-center gap-2.5 py-1 text-sm text-slate-700 dark:text-slate-300">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {f}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onDismiss} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Maybe Later
          </button>
          <Link href="/upgrade" className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm">
            Upgrade — ₹299/mo
          </Link>
        </div>

        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-4">7-day free trial. No credit card required.</p>
      </div>
    </div>
  )
}
