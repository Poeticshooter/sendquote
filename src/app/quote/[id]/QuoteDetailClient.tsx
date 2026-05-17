"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { formatINR } from "@/lib/utils"
import { sanitizeInput } from "@/lib/sanitize"
import { checkQuota, incrementQuoteCount } from "@/lib/plan"
import { csrfFetch } from "@/lib/csrf-client"
import { useToast } from "@/components/toast"
import ActivityTimeline from "@/components/activity-timeline"

type QuoteItem = { id: string; description: string; spec?: string; quantity: number; unit: string; rate: number; amount: number; sort_order: number }
type QuoteEvent = { id: string; event_type: string; ip_address: string; user_agent: string; device_type: string; notes: string; created_at: string }
type Quote = { id: string; quote_number: string; client_name: string; client_email: string; client_phone: string; client_address: string; valid_until: string; status: string; subtotal: number; discount: number; discount_type: string; gst_rate: number; gst_amount: number; total: number; notes: string; terms: string; payment_terms: string; unique_token: string; created_at: string; internal_notes?: string; tags?: string[]; template_name?: string; is_template?: boolean }
type Profile = { business_name: string; logo_url: string; phone: string; gst_number: string }

const TAG_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  followup: "bg-amber-100 text-amber-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-slate-100 text-slate-700",
  priority: "bg-violet-100 text-violet-700",
}

import { getStatusStyle } from "@/lib/status-styles"

const eventIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  sent: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>, color: "text-blue-500" },
  opened: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, color: "text-amber-500" },
  accepted: { icon: <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: "text-emerald-500" },
  changes_requested: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>, color: "text-violet-500" },
  expired: { icon: <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: "text-red-500" },
  viewed: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, color: "text-slate-500" },
  archived: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>, color: "text-slate-500" },
}

export default function QuoteDetailClient() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [events, setEvents] = useState<QuoteEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [shareLink, setShareLink] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const [newTag, setNewTag] = useState("")
  const loadRef = useRef<(() => void) | null>(null)

  const loadQuote = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data: q } = await supabase.from("quotes").select("*").eq("id", id).eq("user_id", user.id).single()
    if (!q) { router.push("/dashboard"); return }
    setQuote(q as Quote)

    const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()
    setProfile(prof as Profile)

    const { data: itemRows } = await supabase.from("quote_items").select("*").eq("quote_id", id).order("sort_order")
    setItems((itemRows as QuoteItem[]) || [])

    const { data: eventRows } = await supabase.from("quote_events").select("*").eq("quote_id", id).order("created_at", { ascending: false }).limit(20)
    setEvents((eventRows as QuoteEvent[]) || [])

    setShareLink(`${window.location.origin}/q/${q.unique_token}`)
    setInternalNotes(q.internal_notes || "")
    setLoading(false)
  }, [id, supabase, router])

  loadRef.current = loadQuote
  useEffect(() => { loadRef.current?.() }, [id])

  // Realtime subscription for quote updates
  useEffect(() => {
    const channel = supabase
      .channel('quote-detail')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes', filter: `id=eq.${id}` }, () => {
        loadQuote()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, id, loadQuote])

  async function updateStatus(newStatus: string) {
    if (!quote) return
    await supabase.from("quotes").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", quote.id)
    if (newStatus === "sent") {
      await supabase.from("quote_events").insert({ quote_id: quote.id, event_type: "sent" })
      if (quote.client_email) {
        csrfFetch("/api/send-quote-email", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quoteId: quote.id }),
        }).catch(() => {})
      }
    }
    toast(`Status updated to ${newStatus.replace("_", " ")}`, "success")
    loadQuote()
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareLink)
    toast("Link copied to clipboard!", "success")
  }

  function shareWhatsApp() {
    let phone = quote?.client_phone?.replace(/\D/g, '') || ''
    if (!phone) {
      phone = prompt("Enter client's WhatsApp number (with country code, e.g. 919876543210):") || ''
      phone = phone.replace(/\D/g, '')
    }
    if (!phone) return
    const msg = encodeURIComponent(`Hi, please review my quote ${quote?.quote_number}: ${shareLink}`)
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`, "_blank")
  }

  async function handleSaveTemplate() {
    const name = prompt("Template name:", quote?.template_name || quote?.quote_number || "")
    if (!name || !quote) return
    await supabase.from("quotes").update({
      is_template: true,
      template_name: name,
    }).eq("id", quote.id)
    toast("Saved as template!", "success")
    loadQuote()
  }

  async function saveInternalNotes() {
    setSavingNotes(true)
    await supabase.from("quotes").update({ internal_notes: internalNotes }).eq("id", quote!.id)
    toast("Notes saved", "success")
    setSavingNotes(false)
  }

  async function addTag() {
    if (!newTag.trim() || !quote) return
    const tags = [...(quote.tags || []), newTag.trim().toLowerCase()]
    await supabase.from("quotes").update({ tags }).eq("id", quote.id)
    setQuote({ ...quote, tags })
    setNewTag("")
    setShowTagInput(false)
  }

  async function removeTag(tag: string) {
    if (!quote) return
    const tags = (quote.tags || []).filter(t => t !== tag)
    await supabase.from("quotes").update({ tags }).eq("id", quote.id)
    setQuote({ ...quote, tags })
  }

  async function handleConvertToInvoice() {
    if (!quote) return
    const res = await csrfFetch("/api/convert-to-invoice", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId: quote.id }),
    })
    const json = await res.json()
    if (res.ok) {
      toast("Invoice created!", "success")
      router.push(`/invoice/${json.invoiceId}`)
    } else toast(json.error || "Conversion failed", "error")
  }

  async function handleArchive() {
    if (!confirm("Archive this quote? It will be hidden from the dashboard.")) return
    await supabase.from("quotes").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", quote!.id)
    toast("Quote archived", "success")
    router.push("/dashboard")
  }

  async function handleRestore() {
    await supabase.from("quotes").update({ status: "draft", updated_at: new Date().toISOString() }).eq("id", quote!.id)
    toast("Quote restored", "success")
    loadQuote()
  }

  async function handleDuplicate() {
    if (!quote) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const quota = await checkQuota(user.id, 'quote')
    if (!quota.allowed) {
      toast("Free plan: 3 quotes/month. Upgrade for ₹299.", "error")
      return
    }

    const res = await csrfFetch('/api/duplicate-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: quote.id }),
    })

    if (!res.ok) {
      toast("Failed to duplicate quote", "error")
      return
    }

    const data = await res.json()
    toast("Quote duplicated! Taking you to edit...", "success")
    router.push(`/quote/${data.quoteId}/edit`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="space-y-4 w-96">
          <div className="skeleton h-6 w-1/3 mx-auto" />
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!quote) return null

  const isSentOrOpened = quote.status === "sent" || quote.status === "opened"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="print-hide sticky top-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#4F46E5" />
                <path d="M10 10h12M10 16h8M10 22h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M22 18l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              SendQuote
            </Link>
            <span className="text-sm text-slate-500 dark:text-slate-400">#{quote.quote_number}</span>
            <span className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize ${getStatusStyle(quote.status)}`}>
              {quote.status.replace("_", " ")}
            </span>
            {(quote.tags || []).length > 0 && (
              <div className="flex gap-1">
                {(quote.tags || []).map(t => (
                  <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize flex items-center gap-0.5 ${TAG_COLORS[t] || "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:opacity-70">×</button>
                  </span>
                ))}
              </div>
            )}
            {showTagInput ? (
              <div className="flex items-center gap-1">
                <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()}
                  placeholder="tag" className="text-xs border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 w-20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" autoFocus />
                <button onClick={addTag} className="text-xs text-indigo-600 dark:text-indigo-400">Add</button>
                <button onClick={() => setShowTagInput(false)} className="text-xs text-slate-400 dark:text-slate-500">×</button>
              </div>
            ) : (
              <button onClick={() => setShowTagInput(true)} className="text-xs text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400">+ Tag</button>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <a href={`/api/quote-pdf/${id}`} target="_blank"
              className="btn-secondary text-xs flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span className="hidden sm:inline">PDF</span>
            </a>
            <button onClick={() => window.print()} className="btn-secondary text-xs flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Print</span>
            </button>
            {quote.status === "draft" && (
              <>
                <Link href={`/quote/${id}/edit`} className="btn-secondary text-xs">Edit</Link>
                <button onClick={() => updateStatus("sent")} className="btn-primary text-xs">Mark Sent</button>
              </>
            )}
            <button onClick={handleDuplicate} title="Duplicate quote"
              className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
            </button>
            {quote.status === "archived" ? (
              <button onClick={handleRestore} title="Restore quote"
                className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </button>
            ) : (
              <button onClick={handleArchive} title="Archive quote"
                className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </button>
            )}
            <button onClick={handleSaveTemplate} title="Save as template"
              className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
        {isSentOrOpened && (
          <div className="print-hide bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Share with client</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Send this link via WhatsApp, SMS, or email</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input type="text" value={shareLink} readOnly
                className="text-xs flex-1 sm:w-64 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none" />
              <button onClick={copyLink} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all whitespace-nowrap">Copy</button>
              <button onClick={shareWhatsApp}
                className="bg-emerald-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all whitespace-nowrap flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                WhatsApp
              </button>
            </div>
          </div>
        )}

        <div className="print-container bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{profile?.business_name || "Your Business"}</h1>
                {profile?.gst_number && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">GST: {profile.gst_number}</p>}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-lg font-bold text-slate-900 dark:text-white">Quote #{quote.quote_number}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Date: {new Date(quote.created_at).toLocaleDateString("en-IN")}</p>
                {quote.valid_until && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Valid Till: {new Date(quote.valid_until).toLocaleDateString("en-IN")}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Bill To</p>
            <p className="font-semibold text-slate-900 dark:text-white">{quote.client_name}</p>
            {quote.client_address && <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{quote.client_address}</p>}
            {quote.client_phone && <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Phone: {quote.client_phone}</p>}
            {quote.client_email && <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Email: {quote.client_email}</p>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="text-left px-6 py-3.5 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3.5 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-3.5 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden md:table-cell">Spec</th>
                  <th className="text-right px-4 py-3.5 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Qty</th>
                  <th className="text-right px-4 py-3.5 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Rate</th>
                  <th className="text-right px-6 py-3.5 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
{items.map((item, i) => (
                    <tr key={item.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-3.5 text-slate-400 dark:text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3.5 text-slate-900 dark:text-white">{item.description}</td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-sm hidden md:table-cell">{item.spec || '-'}</td>
                      <td className="px-4 py-3.5 text-right text-slate-700 dark:text-slate-300">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3.5 text-right text-slate-700 dark:text-slate-300">{formatINR(item.rate)}</td>
                      <td className="px-6 py-3.5 text-right font-medium text-slate-900 dark:text-white">{formatINR(item.amount)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 sm:px-8 py-5 border-t border-slate-100 dark:border-slate-700 flex justify-end">
            <div className="w-72 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>{formatINR(quote.subtotal)}</span>
              </div>
              {Number(quote.discount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-{formatINR(Number(quote.discount))}</span>
                </div>
              )}
              {Number(quote.gst_rate) > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>GST ({quote.gst_rate}%)</span>
                  <span>{formatINR(Number(quote.gst_amount))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 text-slate-900 dark:text-white">
                <span>Total</span>
                <span>{formatINR(Number(quote.total))}</span>
              </div>
            </div>
          </div>

          {(quote.notes || quote.terms || quote.payment_terms) && (
            <div className="px-6 sm:px-8 py-5 border-t border-slate-100 dark:border-slate-700 grid sm:grid-cols-2 gap-6 text-sm">
              {quote.notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}
              {quote.terms && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Terms & Conditions</p>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{quote.terms}</p>
                </div>
              )}
              {quote.payment_terms && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Payment Terms</p>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{quote.payment_terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Activity Timeline</h3>
          <ActivityTimeline entityType="quote" entityId={quote.id} />
        </div>

        {events.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Tracking Events</h3>
            <div className="space-y-3">
              {events.map(e => (
                <div key={e.id} className="flex items-start gap-3 text-sm animate-fade-in">
                  {eventIcons[e.event_type] ? <span className={`shrink-0 mt-0.5 ${eventIcons[e.event_type].color}`}>{eventIcons[e.event_type].icon}</span> : <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 dark:text-slate-300 capitalize">{e.event_type.replace("_", " ")}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(e.created_at).toLocaleString("en-IN")}
                      {e.device_type && ` · ${e.device_type}`}
                    </p>
                  </div>
                  {e.notes && <p className="text-slate-500 dark:text-slate-400 italic text-xs max-w-[200px] text-right">&quot;{e.notes}&quot;</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg> Internal Notes
            <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">(only visible to you)</span>
          </h3>
          <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)}
            rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 resize-none" placeholder="Add private notes about this quote..." />
          <div className="flex justify-end mt-2">
            <button onClick={saveInternalNotes} disabled={savingNotes}
              className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              {savingNotes ? "Saving..." : "Save Notes"}
            </button>
          </div>
        </div>

        {quote.status === "opened" && (
          <div className="flex gap-3 justify-end">
            <button onClick={() => updateStatus("accepted")}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-emerald-700 transition-all shadow-sm">
              Mark Accepted
            </button>
            <button onClick={() => updateStatus("lost")}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Mark Lost</button>
          </div>
        )}
        {quote.status === "accepted" && (
          <div className="flex justify-end">
            <button onClick={handleConvertToInvoice}
              className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-violet-700 transition-all shadow-sm active:scale-[0.98]">
              Convert to Invoice
            </button>
          </div>
        )}
        {quote.status === "changes_requested" && (
          <div className="flex justify-end">
            <button onClick={() => updateStatus("draft")}
              className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-violet-700 transition-all">
              Revise Quote
            </button>
          </div>
        )}
      </main>
    </div>
  )
}