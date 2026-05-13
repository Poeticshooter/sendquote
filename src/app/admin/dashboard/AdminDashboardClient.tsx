"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"

type Stats = {
  totalUsers: number
  totalQuotes: number
  totalInvoices: number
  monthlyRevenue: number
  lastMonthRevenue: number
  revenueGrowth: string
  acceptedThisMonth: number
  acceptedLastMonth: number
  quoteGrowth: string
  plans: { free: number; starter: number; professional: number; enterprise: number }
  mrr: number
  allUsers: Array<{ id: string; business_name: string; plan: string; plan_expiry: string; billing_cycle: string; created_at: string }>
  subscriptions: Array<{
    id: string
    user_id: string
    plan_type: string
    billing_cycle: string
    amount: number
    base_price?: number
    discount_amount?: number
    gst_amount?: number
    total_amount?: number
    status: string
    current_period_start: string
    current_period_end: string
    created_at: string
  }>
  statusBreakdown: Record<string, number>
  recentUsers: Array<{ id: string; business_name: string; plan: string; plan_expiry: string; billing_cycle: string; created_at: string }>
  recentQuotes: Array<{ id: string; quote_number: string; client_name: string; status: string; total: number; created_at: string }>
  dailyStats: Array<{ created_at: string; total: number; status: string }>
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-50 text-blue-700",
  opened: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  changes_requested: "bg-violet-50 text-violet-700",
  expired: "bg-red-50 text-red-700",
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
}

const statusIcons: Record<string, string> = {
  draft: "📝", sent: "📤", opened: "👀", accepted: "✅",
  changes_requested: "🔄", expired: "⏰", paid: "💰", pending: "⏳",
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  starter: "bg-indigo-50 text-indigo-700",
  professional: "bg-violet-50 text-violet-700",
  enterprise: "bg-amber-50 text-amber-700",
}

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
}

function StatCard({ label, value, sub, trend, color }: { label: string; value: string | number; sub?: string; trend?: string; color?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
    >
      <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
      <p className={`text-3xl font-black ${color || "text-slate-900"} mb-1`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
      {trend && (
        <p className={`text-xs font-medium mt-1 ${parseFloat(trend) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {parseFloat(trend) >= 0 ? "↑" : "↓"} {Math.abs(parseFloat(trend))}% vs last month
        </p>
      )}
    </motion.div>
  )
}

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "quotes" | "revenue">("overview")
  const [userSearch, setUserSearch] = useState("")
  const [quoteSearch, setQuoteSearch] = useState("")
  const router = useRouter()

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats")
    if (res.status === 401) { router.push("/admin/login"); return }
    const data = await res.json()
    setStats(data)
    setLoading(false)
  }, [router])

  useEffect(() => { 
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  async function handleLogout() {
    if (!confirm("Are you sure you want to sign out?")) return
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const filteredUsers = stats.allUsers.filter(u =>
    u.business_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.plan.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredQuotes = stats.recentQuotes.filter(q =>
    q.client_name?.toLowerCase().includes(quoteSearch.toLowerCase()) ||
    q.quote_number?.toLowerCase().includes(quoteSearch.toLowerCase())
  )

  const dailyData = (() => {
    const days: Record<string, { quotes: number; accepted: number; revenue: number }> = {}
    stats.dailyStats.forEach(s => {
      const d = new Date(s.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      if (!days[d]) days[d] = { quotes: 0, accepted: 0, revenue: 0 }
      days[d].quotes++
      if (s.status === "accepted") { days[d].accepted++; days[d].revenue += s.total || 0 }
    })
    return Object.entries(days).slice(-14).map(([date, v]) => ({ date, ...v }))
  })()

  const tabs = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "users", label: "Users", icon: "👥" },
    { key: "quotes", label: "Quotes", icon: "📄" },
    { key: "revenue", label: "Revenue", icon: "💰" },
  ] as const

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#4F46E5" />
                <path d="M10 10h12M10 16h8M10 22h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M22 18l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              SendQuote Admin
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">Internal</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchStats} 
              disabled={loading}
              className="text-sm text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <span className="text-xs text-slate-400 hidden sm:block">Admin Panel</span>
            <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your SendQuote business</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Users"
                value={stats.totalUsers.toLocaleString("en-IN")}
                sub="Registered accounts"
              />
              <StatCard
                label="Total Quotes"
                value={stats.totalQuotes.toLocaleString("en-IN")}
                sub="All time"
              />
              <StatCard
                label="Monthly Revenue"
                value={`₹${stats.monthlyRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                sub="From accepted quotes"
                trend={stats.revenueGrowth}
                color="text-emerald-600"
              />
              <StatCard
                label="Accepted This Month"
                value={stats.acceptedThisMonth}
                sub="Quotes converted"
                trend={stats.quoteGrowth}
                color="text-indigo-600"
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Plan distribution */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Plan Distribution</h3>
                <div className="space-y-4">
                  {(["free", "starter", "professional", "enterprise"] as const).map(plan => {
                    const count = stats.plans[plan]
                    const total = stats.totalUsers || 1
                    const pct = ((count / total) * 100).toFixed(1)
                    return (
                      <div key={plan}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLAN_COLORS[plan]}`}>
                              {PLAN_NAMES[plan]}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{count}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-indigo-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{pct}% of users</p>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    MRR: <span className="font-bold text-emerald-600">
                      ₹{stats.mrr.toLocaleString("en-IN")}
                    </span>
                    <span className="text-slate-400"> / month</span>
                  </p>
                </div>
              </div>

              {/* Quote status breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Quote Status Breakdown</h3>
                <div className="space-y-2.5">
                  {Object.entries(stats.statusBreakdown).sort(([, a], [, b]) => b - a).map(([status, count]) => {
                    const total = stats.totalQuotes || 1
                    const pct = ((count / total) * 100).toFixed(0)
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{statusIcons[status] || "📄"}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[status] || "bg-slate-100 text-slate-600"}`}>
                            {status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 w-6 text-right">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quick stats */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Business Health</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Acceptance rate</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {stats.totalQuotes > 0
                        ? ((stats.statusBreakdown.accepted || 0) / stats.totalQuotes * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full h-px bg-slate-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Avg quote value</span>
                    <span className="text-sm font-bold text-slate-900">
                      {stats.totalQuotes > 0
                        ? `₹${(stats.monthlyRevenue / stats.totalQuotes).toFixed(0)}`
                        : "₹0"}
                    </span>
                  </div>
                  <div className="w-full h-px bg-slate-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Invoices generated</span>
                    <span className="text-sm font-bold text-slate-900">{stats.totalInvoices.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="w-full h-px bg-slate-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">User growth (mo/m)</span>
                    <span className={`text-sm font-bold ${parseFloat(stats.quoteGrowth) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {parseFloat(stats.quoteGrowth) >= 0 ? "+" : ""}{stats.quoteGrowth}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">Recent Users</h3>
                  <button onClick={() => setActiveTab("users")} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all →</button>
                </div>
                <div className="space-y-2">
                  {stats.recentUsers.slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                          {user.business_name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.business_name || "Unnamed"}</p>
                          <p className="text-[10px] text-slate-400">{new Date(user.created_at).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${PLAN_COLORS[user.plan] || PLAN_COLORS.free}`}>
                        {PLAN_NAMES[user.plan] || user.plan}
                      </span>
                    </div>
                  ))}
                  {stats.recentUsers.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No users yet</p>}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">Recent Quotes</h3>
                  <button onClick={() => setActiveTab("quotes")} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all →</button>
                </div>
                <div className="space-y-2">
                  {stats.recentQuotes.slice(0, 5).map(q => (
                    <div key={q.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{q.client_name || "Unknown Client"}</p>
                        <p className="text-[10px] text-slate-400">#{q.quote_number} · {new Date(q.created_at).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">₹{Number(q.total).toLocaleString("en-IN")}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[q.status] || "bg-slate-100 text-slate-600"}`}>
                          {q.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                  {stats.recentQuotes.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No quotes yet</p>}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">All Users ({stats.totalUsers})</h3>
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name or plan..."
                  className="input-field max-w-xs text-sm"
                />
              </div>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Business</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Plan</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Joined</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Revenue Potential</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                            {user.business_name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{user.business_name || "Unnamed"}</p>
                            <p className="text-xs text-slate-400">{user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_COLORS[user.plan] || PLAN_COLORS.free}`}>
                          {PLAN_NAMES[user.plan] || user.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-600">{new Date(user.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-slate-700">
                          {user.plan === "professional" ? "₹799/mo" : user.plan === "starter" ? "₹299/mo" : "₹0 (Free)"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No users found</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Quotes Tab */}
        {activeTab === "quotes" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">All Quotes ({stats.totalQuotes})</h3>
                <input
                  type="text"
                  value={quoteSearch}
                  onChange={e => setQuoteSearch(e.target.value)}
                  placeholder="Search by client or number..."
                  className="input-field max-w-xs text-sm"
                />
              </div>
<table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Business</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Plan</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Billing</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Subscribed</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Valid Until</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => {
                    const userSub = stats.subscriptions.find(s => s.user_id === user.id && s.status === 'active')
                    const planPrice = user.plan === "enterprise" ? 2499 : user.plan === "professional" ? 799 : user.plan === "starter" ? 299 : 0
                    return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                            {user.business_name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{user.business_name || "Unnamed"}</p>
                            <p className="text-xs text-slate-400">{user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_COLORS[user.plan] || PLAN_COLORS.free}`}>
                          {PLAN_NAMES[user.plan] || user.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500">
                          {userSub?.billing_cycle === "annual" ? "Annual" : userSub ? "Monthly" : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-500">
                          {userSub?.current_period_start 
                            ? new Date(userSub.current_period_start).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-500">
                          {userSub?.current_period_end 
                            ? new Date(userSub.current_period_end).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : user.plan_expiry 
                              ? new Date(user.plan_expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                              : "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-slate-700">
                          {userSub ? `₹${Math.round((userSub.total_amount ?? userSub.amount) || 0).toLocaleString("en-IN")}` : planPrice > 0 ? `₹${planPrice}/mo` : "Free"}
                        </span>
                        {userSub && (userSub.gst_amount ?? 0) > 0 && (
                          <p className="text-[10px] text-slate-400">incl. ₹{Math.round(userSub.gst_amount ?? 0)} GST</p>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
              {filteredQuotes.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No quotes found</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Revenue Tab */}
        {activeTab === "revenue" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-500 mb-1">This Month</p>
                <p className="text-3xl font-black text-emerald-600">₹{stats.monthlyRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                <p className={`text-xs font-medium mt-1 ${parseFloat(stats.revenueGrowth) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {parseFloat(stats.revenueGrowth) >= 0 ? "↑" : "↓"} {Math.abs(parseFloat(stats.revenueGrowth))}% vs last month
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-500 mb-1">Last Month</p>
                <p className="text-3xl font-black text-slate-900">₹{stats.lastMonthRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-500 mb-1">MRR (Plans)</p>
                <p className="text-3xl font-black text-indigo-600">
                  ₹{stats.mrr.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-slate-400 mt-1">From subscriptions only</p>
              </div>
            </div>

            {/* 14-day chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Last 14 Days</h3>
              {dailyData.length > 0 ? (
                <div className="flex items-end gap-1 h-48">
                  {dailyData.map((d, i) => {
                    const maxRev = Math.max(...dailyData.map(x => x.revenue), 1)
                    const barH = Math.max((d.revenue / maxRev) * 180, 4)
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <motion.div
                          className="w-full bg-indigo-100 hover:bg-indigo-200 rounded-t-md transition-colors cursor-pointer relative"
                          style={{ height: `${barH}px` }}
                          initial={{ height: 0 }}
                          animate={{ height: `${barH}px` }}
                          transition={{ duration: 0.5, delay: i * 0.03 }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            ₹{d.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-indigo-400 rounded-t-md opacity-80" style={{ height: `${((d.accepted / Math.max(d.quotes, 1)) * 100)}%` }} />
                        </motion.div>
                        <span className="text-[9px] text-slate-400">{d.date}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-12">No revenue data yet</p>
              )}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-3 h-3 rounded-sm bg-indigo-100" />
                  Total quotes
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-3 h-3 rounded-sm bg-indigo-400" />
                  Accepted (revenue)
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
