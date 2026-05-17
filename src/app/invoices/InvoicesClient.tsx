"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { formatINR } from "@/lib/utils"
import { useToast } from "@/components/toast"
import EmptyState from "@/components/empty-state"

type Invoice = {
  id: string
  invoice_number: string
  client_name: string
  total: number
  status: string
  created_at: string
  quote_id: string | null
}

export default function InvoicesClient() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      let query = supabase
        .from("invoices")
        .select("id, invoice_number, client_name, total, status, created_at, quote_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (filter !== "all") query = query.eq("status", filter)

      const { data } = await query
      setInvoices((data as Invoice[]) || [])
      setLoading(false)
    }
    load()
  }, [filter, supabase, router])

  const filtered = search.trim()
    ? invoices.filter(i =>
        i.client_name.toLowerCase().includes(search.toLowerCase()) ||
        i.invoice_number.toLowerCase().includes(search.toLowerCase())
      )
    : invoices

  const statusStyles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700",
    unpaid: "bg-amber-50 text-amber-700",
    cancelled: "bg-red-50 text-red-700",
  }

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
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-900 tracking-tight">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#4F46E5" />
              <path d="M10 10h12M10 16h8M10 22h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M22 18l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            SendQuote
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">← Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
            <p className="text-sm text-slate-500 mt-0.5">{filtered.length} total</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex gap-1.5 flex-wrap">
              {["all", "paid", "unpaid", "cancelled"].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`text-xs whitespace-nowrap px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                    filter === s ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search invoices..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              type="invoices"
              title={search ? "No invoices found" : "No invoices yet"}
              description={search ? "Try adjusting your search" : "Accept a quote to create your first invoice"}
              action={search ? undefined : { label: "View quotes", href: "/dashboard" }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Invoice</th>
                    <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/invoice/${inv.id}`)}
                    >
                      <td className="px-4 py-3.5 font-medium text-slate-900">{inv.invoice_number}</td>
                      <td className="px-4 py-3.5 text-slate-700">{inv.client_name}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">{formatINR(Number(inv.total))}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize ${statusStyles[inv.status] || "bg-slate-100 text-slate-600"}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {new Date(inv.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-indigo-600 text-xs font-medium">View →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}