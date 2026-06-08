"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, TrendingUp, IndianRupee, Target, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HealthScore } from "@/components/gamification/health-score";
import { AchievementBadges } from "@/components/gamification/achievement-badges";
import { ReferralWidget } from "@/components/gamification/referral-widget";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<{
    totalQuotes: number; accepted: number; opened: number;
    totalRevenue: number; winRate: number;
    recentQuotes: { id: string; client_name: string; quote_number: string; total: number; status: string }[];
    plan: string; monthlyLimit: number; usedThisMonth: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, plan, monthly_quote_count")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        router.push("/onboarding");
        return;
      }

      if (!profile.onboarding_completed) {
        localStorage.removeItem("sq_onboarding_done");
        router.push("/onboarding");
        return;
      }

      localStorage.setItem("sq_onboarding_done", "true");

      const { data: quotes } = await supabase
        .from("quotes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (!quotes) {
        setLoading(false);
        return;
      }

      setData({
        totalQuotes: quotes.length,
        accepted: quotes.filter((q) => q.status === "accepted").length,
        opened: quotes.filter((q) => q.status === "opened" || q.status === "sent").length,
        totalRevenue: quotes.filter((q) => q.status === "accepted").reduce((s: number, q: { total: number }) => s + Number(q.total), 0),
        winRate: quotes.length > 0 ? Math.round((quotes.filter((q) => q.status === "accepted").length / quotes.length) * 100) : 0,
        recentQuotes: quotes.slice(0, 5),
        plan: profile?.plan || "starter",
        monthlyLimit: profile?.plan === "free" ? 5 : profile?.plan === "starter" ? 50 : 99999,
        usedThisMonth: profile?.monthly_quote_count || 0,
      });
      setLoading(false);
    }
    load().catch((e) => {
      console.error("Dashboard data fetch error:", e);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-red-500/10 p-4 mb-4">
          <FileText className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Failed to load dashboard</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          Something went wrong loading your data. This could be a temporary issue.
        </p>
        <Link href="/dashboard" className={buttonVariants()}>
          Try Again
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with streak */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground text-sm">{data.totalQuotes > 0 ? `${data.totalQuotes} quotes, ${data.winRate}% win rate` : "Start by creating your first quote"}</p>
          </div>
        </div>
        <Link href="/quotes/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" /> New Quote
        </Link>
      </div>

      {/* Gamification Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <AchievementBadges />
        </div>
        <HealthScore />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalQuotes}</div>
            <p className="text-xs text-muted-foreground">{data.usedThisMonth}/{data.monthlyLimit} this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.winRate}%</div>
            <p className="text-xs text-muted-foreground">{data.accepted} of {data.totalQuotes} accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.opened}</div>
            <p className="text-xs text-muted-foreground">Quotes awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{data.totalRevenue.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground">From accepted quotes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentQuotes.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">No quotes yet. Create your first one!</p>
                  <Link href="/quotes/new" className={buttonVariants({ size: "sm", className: "mt-4" })}>
                    <Plus className="mr-1 h-3 w-3" /> Create Quote
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentQuotes.map((q) => (
                    <Link key={q.id} href={`/quotes/${q.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{q.client_name}</p>
                        <p className="text-xs text-muted-foreground">{q.quote_number}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium">₹{Number(q.total).toLocaleString("en-IN")}</p>
                        <span className={`text-xs ${
                          q.status === "accepted" ? "text-[#00D4AA]" :
                          q.status === "sent" || q.status === "opened" ? "text-blue-400" :
                          q.status === "draft" ? "text-muted-foreground" : "text-red-400"
                        }`}>
                          {q.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Panel: Quick Actions + Referral */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/quotes/new" className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00D4AA]/10 text-[#00D4AA]">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Create New Quote</p>
                  <p className="text-xs text-muted-foreground">AI-powered in 60s</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link href="/quotes" className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">All Quotes</p>
                  <p className="text-xs text-muted-foreground">Manage & track</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link href="/analytics" className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Analytics</p>
                  <p className="text-xs text-muted-foreground">Win rate & revenue</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link href="/settings" className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Plan & Billing</p>
                  <p className="text-xs text-muted-foreground capitalize">Current: {data.plan}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>

          <ReferralWidget />
        </div>
      </div>
    </div>
  );
}
