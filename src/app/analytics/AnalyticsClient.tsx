"use client"

import Link from "next/link"
import { formatINR } from "@/lib/utils"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

type AnalyticsClientProps = {
  profile: { business_name: string; plan: string } | null
  stats: {
    totalQuotes: number
    acceptedQuotes: number
    totalValueSent: number
    totalValueAccepted: number
    avgQuoteValue: number
    acceptanceRate: number
  }
  weeklyData: { week: string; created: number; accepted: number }[]
  monthlyRevenue: { month: string; revenue: number }[]
  hasQuotes: boolean
}

export default function AnalyticsClient({ profile, stats, weeklyData, monthlyRevenue, hasQuotes }: AnalyticsClientProps) {
  if (!hasQuotes) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No analytics yet</h2>
            <p className="text-slate-500 mb-6">Create your first quote to start tracking performance.</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">
              {profile?.business_name || "Your"} quote performance overview
            </p>
          </div>
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Acceptance Rate</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{stats.acceptanceRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-400 mt-1">{stats.acceptedQuotes} of {stats.totalQuotes} quotes</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Value Sent</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatINR(stats.totalValueSent)}</p>
            <p className="text-xs text-slate-400 mt-1">{stats.totalQuotes} quotes</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Value Accepted</p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{formatINR(stats.totalValueAccepted)}</p>
            <p className="text-xs text-slate-400 mt-1">{stats.acceptedQuotes} accepted</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Quote Value</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatINR(stats.avgQuoteValue)}</p>
            <p className="text-xs text-slate-400 mt-1">Per quote</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Quotes Created vs Accepted (Last 12 Weeks)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--text-secondary, #94a3b8)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary, #94a3b8)" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface, #fff)",
                    border: "1px solid var(--border, #e2e8f0)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--text, #0f172a)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="created" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Created" />
                <Line type="monotone" dataKey="accepted" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Accepted" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Revenue by Month (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-secondary, #94a3b8)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary, #94a3b8)" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip
                  formatter={(value: number) => formatINR(value)}
                  contentStyle={{
                    backgroundColor: "var(--surface, #fff)",
                    border: "1px solid var(--border, #e2e8f0)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--text, #0f172a)",
                  }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
