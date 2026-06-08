"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Target, Clock } from "lucide-react";
import Link from "next/link";

// Dynamically import recharts to reduce initial bundle size
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false },
);
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false },
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false },
);

interface Analytics {
  totals: { total: number; accepted: number; lost: number; pending: number };
  revenue: { total: number; avgQuoteValue: number };
  winRate: number;
  recentAccepted: number;
  quotesByStatus: { name: string; value: number }[];
  monthlyRevenue: { month: string; amount: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );

  if (!data || data.totals.total === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <Card className="p-12 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No data yet</h3>
          <p className="text-sm text-muted-foreground">
            Create and send quotes to see analytics here.
          </p>
          <Link
            href="/quotes/new"
            className={buttonVariants({ className: "mt-6" })}
          >
            Create your first quote
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Your quoting performance at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.winRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.totals.accepted} of {data.totals.total} quotes accepted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{data.revenue.total.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg ₹{data.revenue.avgQuoteValue.toLocaleString("en-IN")} per
              quote
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Accepted (30d)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.recentAccepted}</div>
            <p className="text-xs text-muted-foreground">
              Quotes accepted in last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totals.pending}</div>
            <p className="text-xs text-muted-foreground">
              Quotes awaiting response
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quotes by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.quotesByStatus.map((s) => {
                const pct = (s.value / data.totals.total) * 100;
                const colors: Record<string, string> = {
                  Draft: "bg-gray-400",
                  Sent: "bg-blue-400",
                  Opened: "bg-amber-400",
                  Accepted: "bg-green-400",
                  Lost: "bg-red-400",
                };
                return (
                  <div key={s.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{s.name}</span>
                      <span className="text-muted-foreground">
                        {s.value} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full bg-muted overflow-hidden"
                      role="progressbar"
                      aria-valuenow={s.value}
                      aria-valuemin={0}
                      aria-valuemax={data.totals.total}
                      aria-label={`${s.name}: ${s.value} quotes`}
                    >
                      <div
                        className={`h-full rounded-full ${colors[s.name] || "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {data.monthlyRevenue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No revenue yet
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v: number) =>
                        `₹${(v / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
