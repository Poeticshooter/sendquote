"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, Activity, AlertTriangle, TrendingUp, DollarSign, MousePointerClick } from "lucide-react";
import Link from "next/link";

interface AdminStats {
  userCount: number;
  auditLogCount: number;
  quoteCount: number;
  errorCount: number;
  activeUsers30d?: number;
  quotesThisMonth?: number;
  totalRevenue?: number;
  topClients?: { name: string; count: number }[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => {
      if (!r.ok) throw new Error("Unauthorized");
      return r.json();
    }).then((d) => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { href: "/admin/users", label: "Total Users", value: stats.userCount, icon: Users, sub: `${stats.activeUsers30d ?? "—"} active (30d)`, color: "from-blue-500/20 to-blue-600/10", iconColor: "text-blue-400" },
    { href: "/admin/logs", label: "Audit Events", value: stats.auditLogCount, icon: Activity, sub: "System activity log", color: "from-purple-500/20 to-purple-600/10", iconColor: "text-purple-400" },
    { label: "Total Quotes", value: stats.quoteCount, icon: FileText, sub: `${stats.quotesThisMonth ?? "—"} this month`, color: "from-emerald-500/20 to-emerald-600/10", iconColor: "text-emerald-400" },
    { label: "Error Logs", value: stats.errorCount, icon: AlertTriangle, sub: stats.errorCount > 0 ? `${stats.errorCount} issues to review` : "No recent errors", color: stats.errorCount > 0 ? "from-red-500/20 to-red-600/10" : "from-gray-500/20 to-gray-600/10", iconColor: stats.errorCount > 0 ? "text-red-400" : "text-gray-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">System-wide overview and management.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Wrapper key={card.label} href={card.href}>
            <Card className="relative overflow-hidden border-border hover:bg-accent/50 transition-colors h-full">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-50`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
              </CardContent>
            </Card>
          </Wrapper>
        ))}
      </div>

      {stats.topClients && stats.topClients.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Top Clients by Quote Volume</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topClients.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{c.name}</span>
                  <span className="font-medium">{c.count} quotes</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/users" className="rounded-xl border border-border bg-card p-5 hover:bg-accent/50 transition-colors">
          <Users className="h-5 w-5 text-blue-400 mb-3" />
          <p className="font-medium text-sm">User Management</p>
          <p className="text-xs text-muted-foreground mt-1">View, search, and manage all users</p>
        </Link>
        <Link href="/admin/logs" className="rounded-xl border border-border bg-card p-5 hover:bg-accent/50 transition-colors">
          <Activity className="h-5 w-5 text-purple-400 mb-3" />
          <p className="font-medium text-sm">Audit Log</p>
          <p className="text-xs text-muted-foreground mt-1">Track system activity and changes</p>
        </Link>
        <Link href="/settings" className="rounded-xl border border-border bg-card p-5 hover:bg-accent/50 transition-colors">
          <TrendingUp className="h-5 w-5 text-emerald-400 mb-3" />
          <p className="font-medium text-sm">Settings</p>
          <p className="text-xs text-muted-foreground mt-1">Platform configuration and billing</p>
        </Link>
      </div>
    </div>
  );
}

function Wrapper({ href, children }: { href?: string; children: React.ReactNode }) {
  if (href) return <Link href={href}>{children}</Link>;
  return <>{children}</>;
}
