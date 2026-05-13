import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createClient()

    const [{ count: totalUsers }, { count: totalQuotes }, { count: totalInvoices }, { count: freeUsers }, { count: starterUsers }, { count: proUsers }, { count: entUsers }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("quotes").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "free"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "starter"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "professional"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "enterprise"),
    ])

    const { data: recentUsers } = await supabase
      .from("profiles")
      .select("id, business_name, plan, plan_expiry, billing_cycle, created_at")
      .order("created_at", { ascending: false })
      .limit(10)

    const { data: allUsers } = await supabase
      .from("profiles")
      .select("id, business_name, plan, plan_expiry, billing_cycle, created_at")
      .order("created_at", { ascending: false })

    const { data: allSubscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    const { data: recentQuotes } = await supabase
      .from("quotes")
      .select("id, quote_number, client_name, status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(10)

    const { data: quoteStats } = await supabase
      .from("quotes")
      .select("status, created_at, total")

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const lastMonthEnd = thisMonthStart

    const thisMonthQuotes = quoteStats?.filter(q => q.created_at >= thisMonthStart) || []
    const lastMonthQuotes = quoteStats?.filter(q => q.created_at >= lastMonthStart && q.created_at < lastMonthEnd) || []

    const acceptedThisMonth = thisMonthQuotes.filter(q => q.status === "accepted").length
    const acceptedLastMonth = lastMonthQuotes.filter(q => q.status === "accepted").length

    const monthlyRevenue = thisMonthQuotes
      .filter(q => q.status === "accepted")
      .reduce((sum, q) => sum + (q.total || 0), 0)

    const lastMonthRevenue = lastMonthQuotes
      .filter(q => q.status === "accepted")
      .reduce((sum, q) => sum + (q.total || 0), 0)

    const statusBreakdown = quoteStats?.reduce((acc: Record<string, number>, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1
      return acc
    }, {}) || {}

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: dailyStats } = await supabase
      .from("quotes")
      .select("created_at, total, status")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: true })

    const mrr = (starterUsers || 0) * 299 + (proUsers || 0) * 799 + (entUsers || 0) * 2499

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalQuotes: totalQuotes || 0,
      totalInvoices: totalInvoices || 0,
      monthlyRevenue,
      lastMonthRevenue,
      revenueGrowth: lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : "0",
      acceptedThisMonth,
      acceptedLastMonth,
      quoteGrowth: acceptedLastMonth > 0 ? (((acceptedThisMonth - acceptedLastMonth) / acceptedLastMonth) * 100).toFixed(1) : "0",
      plans: {
        free: freeUsers || 0,
        starter: starterUsers || 0,
        professional: proUsers || 0,
        enterprise: entUsers || 0,
      },
      mrr: mrr,
      allUsers: allUsers || [],
      subscriptions: allSubscriptions || [],
      statusBreakdown,
      recentUsers: recentUsers || [],
      recentQuotes: recentQuotes || [],
      dailyStats: dailyStats || [],
    })
  } catch (err) {
    console.error("Admin stats error:", err)
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
