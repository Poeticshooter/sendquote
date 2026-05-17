"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import NextImage from "next/image"
import { formatINR } from "@/lib/utils"

type QuoteItem = { id: string; description: string; spec?: string; quantity: number; unit: string; rate: number; amount: number }
type QuoteData = {
  id: string; quote_number: string; client_name: string; client_email?: string; client_phone?: string; client_address?: string; valid_until: string; status: string
  subtotal: number; discount: number; discount_type: string; gst_rate: number
  gst_amount: number; total: number; notes: string; terms: string; payment_terms: string
  unique_token: string; created_at: string
  business_name: string; logo_url: string; phone: string; gst_number: string; address?: string; upi_id?: string
  items: QuoteItem[]
}

export default function PublicQuoteClient() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [actionMsg, setActionMsg] = useState("")
  const [changesText, setChangesText] = useState("")
  const [showChangesForm, setShowChangesForm] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const tracked = useRef(false)
  const loadRef = useRef<(() => void) | null>(null)

  const loadQuote = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch(`/api/public-quote?token=${token}`)
      if (!res.ok) { setError("Quote not found or has expired."); setLoading(false); setRefreshing(false); return }
      const result = await res.json()

      if (result.status === 'draft' || result.status === 'archived' || result.status === 'lost') {
        setError("This quote is not available for viewing.")
        setLoading(false)
        setRefreshing(false)
        return
      }

      setData(result)
    } catch { setError("Could not load quote.") }
    setLoading(false)
    setRefreshing(false)
  }, [token])

  useEffect(() => {
    loadRef.current = loadQuote
  }, [loadQuote])

  useEffect(() => {
    loadRef.current?.()
    if (token && !tracked.current) {
      tracked.current = true
      const img = new Image()
      img.src = `/api/track?token=${token}`
    }
  }, [token])

  useEffect(() => {
    function onOnline() { setIsOffline(false); loadRef.current?.() }
    function onOffline() { setIsOffline(true) }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientY)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStart === null) return
    const diff = e.touches[0].clientY - touchStart
    if (diff > 80 && window.scrollY === 0) {
      loadRef.current?.()
      setTouchStart(null)
    }
  }

  function handleTouchEnd() {
    setTouchStart(null)
  }

  async function handleAccept() {
    const res = await fetch("/api/public-quote-action", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "accepted" }),
    })
    if (res.ok) setActionMsg("accepted")
  }

  async function handleRequestChanges() {
    if (!changesText.trim()) return
    const res = await fetch("/api/public-quote-action", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "changes_requested", notes: changesText }),
    })
    if (res.ok) setActionMsg("changes_requested")
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quote ${data?.quote_number} from ${data?.business_name}`,
          text: `Check out this quote from ${data?.business_name}`,
          url: window.location.href,
        })
        return
      } catch { /* user cancelled or failed */ }
    }
    const text = encodeURIComponent(`Check out this quote from ${data?.business_name}: ${window.location.href}`)
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 mt-3">Loading quote...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Quote Not Found</h1>
          <p className="text-slate-500">{error || "This quote may have expired or the link is invalid."}</p>
          <p className="text-sm text-slate-400 mt-4">Contact the sender for a fresh quote.</p>
        </div>
      </div>
    )
  }

  const isExpired = data.valid_until && new Date(data.valid_until) < new Date()

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center text-xs font-medium py-2 animate-fade-in">
          You are offline. Some features may not work.
        </div>
      )}
      {refreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-indigo-600 text-white text-xs font-medium py-2 animate-fade-in">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          Refreshing...
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-8 pb-24">
        <div className="text-center mb-8">
          {data.logo_url ? (
            <div className="relative h-16 w-32 mx-auto mb-3">
              <NextImage src={data.logo_url} alt={data.business_name} fill className="object-contain" unoptimized />
            </div>
          ) : (
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
          )}
          <h1 className="text-xl font-bold text-slate-900">{data.business_name}</h1>
          {data.phone && <p className="text-sm text-slate-500 mt-0.5">{data.phone}</p>}
          {data.address && <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">{data.address}</p>}
          {data.gst_number && <p className="text-xs text-slate-400 mt-0.5">GST: {data.gst_number}</p>}
        </div>

        {isExpired && data.status !== "accepted" ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm animate-fade-in">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">This Quote Has Expired</h2>
            <p className="text-slate-500">Contact {data.business_name} for a fresh quote.</p>
          </div>
        ) : actionMsg === "accepted" ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-emerald-200 shadow-sm animate-fade-in-scale">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-emerald-700 mb-2">Quote Accepted!</h2>
            <p className="text-slate-500">Thank you. The sender has been notified.</p>
          </div>
        ) : actionMsg === "changes_requested" ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-violet-200 shadow-sm animate-fade-in-scale">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
            </div>
            <h2 className="text-xl font-bold text-violet-700 mb-2">Changes Requested</h2>
            <p className="text-slate-500">Your message has been sent to {data.business_name}.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-fade-in">
              <div className="p-5 border-b border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Quote</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{data.quote_number}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{new Date(data.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {data.valid_until && <p>Valid till: {new Date(data.valid_until).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Bill To</p>
                <p className="font-semibold text-slate-900">{data.client_name}</p>
                {data.client_address && <p className="text-sm text-slate-600 mt-1">{data.client_address}</p>}
                {data.client_phone && <p className="text-sm text-slate-500 mt-0.5">{data.client_phone}</p>}
                {data.client_email && <p className="text-sm text-slate-500 mt-0.5">{data.client_email}</p>}
              </div>

              <div className="divide-y divide-slate-50">
                {data.items.map((item) => (
                  <div key={item.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.description}</p>
                      <p className="text-xs text-slate-400">{item.quantity} × {item.unit}</p>
                    </div>
                    <p className="text-sm font-medium text-slate-900 shrink-0">{formatINR(item.amount)}</p>
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 space-y-1.5">
                <TotalRow label="Subtotal" value={formatINR(data.subtotal)} />
                {Number(data.discount) > 0 && <TotalRow label="Discount" value={`-${formatINR(Number(data.discount))}`} className="text-red-600" />}
                {Number(data.gst_rate) > 0 && <TotalRow label={`GST (${data.gst_rate}%)`} value={formatINR(Number(data.gst_amount))} />}
                <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-2 text-slate-900">
                  <span>Total</span>
                  <span>{formatINR(Number(data.total))}</span>
                </div>
              </div>

              {(data.notes || data.terms) && (
                <div className="px-5 py-4 border-t border-slate-100 space-y-3">
                  {data.notes && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.notes}</p>
                    </div>
                  )}
                  {data.terms && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Terms</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.terms}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 z-40 safe-area-pb">
              <div className="max-w-lg mx-auto space-y-3">
                {showChangesForm ? (
                  <div className="space-y-3 animate-fade-in">
                    <textarea value={changesText} onChange={e => setChangesText(e.target.value)}
                      rows={2} placeholder="Describe what changes you need..."
                      className="input-field resize-none" aria-label="Describe changes you need" />
                    <div className="flex gap-2">
                      <button onClick={() => setShowChangesForm(false)}
                        className="flex-1 btn-secondary text-sm">Cancel</button>
                      <button onClick={handleRequestChanges} disabled={!changesText.trim()}
                        className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-violet-700 disabled:opacity-50 transition-all">Send Request</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <button onClick={handleAccept}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-semibold text-base hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-[0.98] flex items-center justify-center gap-2"
                        aria-label="Accept this quote"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        <span>Accept Quote</span>
                      </button>
                      <button onClick={() => setShowChangesForm(true)}
                        className="flex-1 bg-white text-slate-700 py-3 rounded-2xl font-medium text-base border border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.98]">
                        Request Changes
                      </button>
                    </div>
                    {data.upi_id && (
                      <a
                        href={`upi://pay?pa=${encodeURIComponent(data.upi_id)}&pn=${encodeURIComponent(data.business_name)}&am=${Number(data.total)}&cu=INR&tn=${encodeURIComponent(`Quote ${data.quote_number}`)}`}
                        className="block w-full bg-indigo-600 text-white py-3 rounded-2xl font-semibold text-base hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] text-center flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                        Pay ₹{Number(data.total).toLocaleString('en-IN')} via UPI
                      </a>
                    )}
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => window.print()}
                        className="text-indigo-600 text-xs font-medium py-1.5 hover:text-indigo-700 transition-colors flex items-center gap-1.5"
                        aria-label="Print this quote"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={handleShare}
                        className="text-emerald-700 text-xs font-medium py-1.5 hover:text-emerald-800 transition-colors flex items-center gap-1.5"
                        aria-label="Share this quote"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-9.364a2.25 2.25 0 10-3.935-2.185 2.25 2.25 0 003.935 2.185zm0 9.364c-.18.324-.283.696-.283 1.093s.103.77.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314" />
                        </svg>
                        Share
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        <p className="text-center text-xs text-slate-400 mt-6" style={{ marginBottom: '7rem' }}>
          Powered by{" "}
          <a href="https://sendquote.in" className="text-indigo-500 hover:text-indigo-600">SendQuote</a>
        </p>
      </div>
    </div>
  )
}

function TotalRow({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between text-sm ${className || "text-slate-600"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
