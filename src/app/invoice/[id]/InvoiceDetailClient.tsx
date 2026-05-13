"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { formatINR } from "@/lib/utils"
import { useToast } from "@/components/toast"

type Invoice = {
  id: string; invoice_number: string; client_name: string; client_email: string
  client_phone: string; client_address: string; status: string
  subtotal: number; discount: number; discount_type: string
  gst_rate: number; gst_amount: number; total: number
  notes: string; terms: string; created_at: string; quote_id: string
  due_date: string | null
}

type InvoiceItem = { id: string; description: string; quantity: number; unit: string; rate: number; amount: number }
type Payment = { id: string; amount: number; payment_date: string; payment_method: string; notes: string }

export default function InvoiceDetailClient() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [profile, setProfile] = useState<{ business_name: string; logo_url: string; phone: string; gst_number: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [newPayment, setNewPayment] = useState({ amount: 0, payment_date: "", payment_method: "bank_transfer", notes: "" })
  const [savingPayment, setSavingPayment] = useState(false)
  const loadRef = useRef<(() => void) | null>(null)
  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data: inv } = await supabase.from("invoices").select("*").eq("id", id).eq("user_id", user.id).single()
    if (!inv) { router.push("/dashboard"); return }
    setInvoice(inv as Invoice)

    const { data: prof } = await supabase.from("profiles").select("business_name, logo_url, phone, gst_number").eq("user_id", user.id).single()
    setProfile(prof as any)

    const { data: itemRows } = await supabase.from("invoice_items").select("*").eq("invoice_id", id).order("sort_order")
    setItems((itemRows as InvoiceItem[]) || [])

    const { data: payRows } = await supabase.from("payments").select("*").eq("invoice_id", id).order("payment_date", { ascending: false })
    setPayments((payRows as Payment[]) || [])
    setLoading(false)
  }, [id, supabase, router])

  loadRef.current = load
  useEffect(() => { loadRef.current?.() }, [id])

  // Realtime subscription for invoice updates
  useEffect(() => {
    const channel = supabase
      .channel('invoice-detail')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `id=eq.${id}` }, () => {
        load()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `invoice_id=eq.${id}` }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, id, load])

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)
  const outstanding = Number(invoice?.total || 0) - totalPaid

  async function handleAddPayment() {
    if (!newPayment.amount || !newPayment.payment_date) {
      toast("Amount and date are required", "error")
      return
    }
    const totalInvoiceAmount = Number(invoice?.total || 0)
    const remainingToPay = totalInvoiceAmount - totalPaid
    if (newPayment.amount > remainingToPay + 0.01) {
      toast(`Amount exceeds remaining balance of ₹${remainingToPay.toFixed(2)}`, "error")
      return
    }
    setSavingPayment(true)
    const { error } = await supabase.from("payments").insert({
      invoice_id: id,
      amount: newPayment.amount,
      payment_date: newPayment.payment_date,
      payment_method: newPayment.payment_method,
      notes: newPayment.notes,
    })
    if (error) { toast(error.message, "error") }
    else {
      toast("Payment recorded!", "success")
      setShowPaymentModal(false)
      setNewPayment({ amount: 0, payment_date: "", payment_method: "bank_transfer", notes: "" })
      load()
    }
    setSavingPayment(false)
  }

  async function updateStatus(newStatus: string) {
    await supabase.from("invoices").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", id)
    load()
    toast(`Status updated to ${newStatus}`, "success")
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="skeleton h-8 w-48" /></div>
  }

  if (!invoice) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="print-hide sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-900 tracking-tight">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#4F46E5" />
                <path d="M10 10h12M10 16h8M10 22h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M22 18l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              SendQuote
            </Link>
            <span className="text-sm text-slate-500">{invoice.invoice_number}</span>
            <span className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize ${
              invoice.status === "paid" ? "bg-emerald-50 text-emerald-700" : invoice.status === "unpaid" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
            }`}>{invoice.status}</span>
            {outstanding > 0 && <span className="text-xs text-amber-600 font-medium">₹{outstanding.toLocaleString("en-IN")} due</span>}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/api/invoice-pdf/${id}`} target="_blank"
              className="btn-secondary text-xs flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span className="hidden sm:inline">PDF</span>
            </Link>
            {invoice.quote_id && (
              <Link href={`/quote/${invoice.quote_id}`} className="btn-secondary text-xs">View Quote</Link>
            )}
            {outstanding > 0 && (
              <button onClick={() => setShowPaymentModal(true)} className="bg-emerald-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all">
                Record Payment
              </button>
            )}
            {invoice.status === "unpaid" && (
              <button onClick={() => updateStatus("paid")} className="btn-secondary text-xs">Mark Paid</button>
            )}
            {invoice.status === "paid" && (
              <button onClick={() => updateStatus("unpaid")} className="btn-secondary text-xs">Mark Unpaid</button>
            )}
            <button onClick={() => window.print()} className="btn-secondary text-xs">Print</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
        <div className="print-container bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{profile?.business_name || "Your Business"}</h1>
                {profile?.gst_number && <p className="text-sm text-slate-500 mt-0.5">GST: {profile.gst_number}</p>}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-lg font-bold text-slate-900">{invoice.invoice_number}</p>
                <p className="text-sm text-slate-500">Date: {new Date(invoice.created_at).toLocaleDateString("en-IN")}</p>
                {invoice.due_date && <p className="text-sm text-slate-500">Due: {new Date(invoice.due_date).toLocaleDateString("en-IN")}</p>}
                <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  invoice.status === "paid" ? "bg-emerald-50 text-emerald-700" : invoice.status === "unpaid" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                }`}>{invoice.status}</span>
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Bill To</p>
            <p className="font-semibold text-slate-900">{invoice.client_name}</p>
            {invoice.client_address && <p className="text-sm text-slate-600 mt-0.5">{invoice.client_address}</p>}
            {invoice.client_phone && <p className="text-sm text-slate-600 mt-0.5">Phone: {invoice.client_phone}</p>}
            {invoice.client_email && <p className="text-sm text-slate-600 mt-0.5">Email: {invoice.client_email}</p>}
          </div>

          {/* Items */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Description</th>
                  <th className="text-right px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Qty</th>
                  <th className="text-right px-4 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Rate</th>
                  <th className="text-right px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="px-6 py-3.5 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3.5 text-slate-900">{item.description}</td>
                    <td className="px-4 py-3.5 text-right text-slate-700">{item.quantity} {item.unit}</td>
                    <td className="px-4 py-3.5 text-right text-slate-700">{formatINR(item.rate)}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-slate-900">{formatINR(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-6 sm:px-8 py-5 border-t border-slate-100 flex justify-end">
            <div className="w-72 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatINR(invoice.subtotal)}</span></div>
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between text-red-600"><span>Discount</span><span>-{formatINR(Number(invoice.discount))}</span></div>
              )}
              {Number(invoice.gst_rate) > 0 && (
                <div className="flex justify-between text-slate-600"><span>GST ({invoice.gst_rate}%)</span><span>{formatINR(Number(invoice.gst_amount))}</span></div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-2 text-slate-900">
                <span>Total</span><span>{formatINR(Number(invoice.total))}</span>
              </div>
            </div>
          </div>

          {/* Notes/Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="px-6 sm:px-8 py-5 border-t border-slate-100 grid sm:grid-cols-2 gap-6 text-sm">
              {invoice.notes && <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p><p className="text-slate-700 whitespace-pre-wrap">{invoice.notes}</p></div>}
              {invoice.terms && <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Terms</p><p className="text-slate-700 whitespace-pre-wrap">{invoice.terms}</p></div>}
            </div>
          )}

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="px-6 sm:px-8 py-5 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Payment History</p>
              <div className="space-y-2">
                {payments.map(p => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">{new Date(p.payment_date).toLocaleDateString("en-IN")}</span>
                    <span className="text-slate-900 font-medium">{formatINR(Number(p.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Record Payment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Amount (₹)</label>
                  <input type="number" value={newPayment.amount || ""} onChange={e => setNewPayment(p => ({ ...p, amount: Number(e.target.value) }))}
                    className="input-field" placeholder="Enter amount" min={0} step="0.01" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Date</label>
                  <input type="date" value={newPayment.payment_date} onChange={e => setNewPayment(p => ({ ...p, payment_date: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Method</label>
                  <select value={newPayment.payment_method} onChange={e => setNewPayment(p => ({ ...p, payment_method: e.target.value }))} className="input-field">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Notes</label>
                  <input type="text" value={newPayment.notes} onChange={e => setNewPayment(p => ({ ...p, notes: e.target.value }))}
                    className="input-field" placeholder="Transaction reference, etc." />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowPaymentModal(false)} className="flex-1 btn-secondary text-sm">Cancel</button>
                  <button onClick={handleAddPayment} disabled={savingPayment} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-emerald-700 transition-all disabled:opacity-50">
                    {savingPayment ? "Saving..." : "Save Payment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">Generated by SendQuote</p>
      </main>
    </div>
  )
}
