import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

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
      .limit(100)

    const { data: allSubscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50)

    const { data: recentQuotes } = await supabase
      .from("quotes")
      .select("id, quote_number, client_name, status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(10)

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const lastMonthEnd = thisMonthStart

    const { data: thisMonthAccepted } = await supabase
      .from("quotes")
      .select("total")
      .eq("status", "accepted")
      .gte("created_at", thisMonthStart)

    const { data: lastMonthAccepted } = await supabase
      .from("quotes")
      .select("total")
      .eq("status", "accepted")
      .gte("created_at", lastMonthStart)
      .lt("created_at", lastMonthEnd)

    const acceptedThisMonth = thisMonthAccepted?.length || 0
    const acceptedLastMonth = lastMonthAccepted?.length || 0

    const monthlyRevenue = thisMonthAccepted?.reduce((sum, q) => sum + Number(q.total || 0), 0) || 0
    const lastMonthRevenue = lastMonthAccepted?.reduce((sum, q) => sum + Number(q.total || 0), 0) || 0

    const { data: statusCounts } = await supabase
      .from("quotes")
      .select("status")

    const statusBreakdown: Record<string, number> = {}
    for (const q of statusCounts || []) {
      statusBreakdown[q.status] = (statusBreakdown[q.status] || 0) + 1
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: dailyStats } = await supabase
      .from("quotes")
      .select("created_at, total, status")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: true })

    const mrr = (starterUsers || 0) * 299 + (proUsers || 0) * 799 + (entUsers || 0) * 2499

    const { count: totalCoupons } = await supabase.from("coupons").select("*", { count: "exact", head: true })
    const { count: activeCoupons } = await supabase.from("coupons").select("*", { count: "exact", head: true }).eq("active", true)
    const { data: couponUsageData } = await supabase.from("coupon_usages").select("discount_applied")
    const totalDiscountsGiven = couponUsageData?.reduce((sum, u) => sum + Number(u.discount_applied || 0), 0) || 0

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
      couponStats: {
        total: totalCoupons || 0,
        active: activeCoupons || 0,
        totalDiscountsGiven,
      },
    })
  } catch (err) {
    logger.error("Admin stats error", { error: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
