"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import Link from "next/link"

type VoiceItem = {
  description: string
  quantity: string
  unit: string
  rate: string
}

type QuoteData = {
  clientName: string
  clientPhone: string
  clientEmail: string
  clientAddress: string
  validTill: string
  discountType: "percentage" | "fixed"
}

const STEPS = [
  { id: "clientName", label: "Client Name", ask: "Who is this quote for?", hint: "Say the client's name, like Rahul Sharma", examples: ["Rahul Sharma", "Priya Patel", "ABC Construction"] },
  { id: "clientPhone", label: "Phone", ask: "What's the client's phone number?", hint: "Say the 10-digit number", examples: ["9876543210", "Nine eight seven six five four"] },
  { id: "clientEmail", label: "Email", ask: "What's their email? Say skip if not available.", hint: "Email or skip", examples: ["rahul@example.com", "skip"] },
  { id: "clientAddress", label: "Address", ask: "What's the address? Say skip if not needed.", hint: "Address or skip", examples: ["42 MG Road Mumbai", "Shop 12 Market", "skip"] },
  { id: "validTill", label: "Valid Till", ask: "How many days should this quote be valid? Default is 30 days.", hint: "Say number of days", examples: ["7 days", "thirty days", "2 weeks"] },
]

const ITEM_PROMPTS = [
  { ask: "What's the first item? Say the description.", hint: "Describe the work or product", examples: ["Interior painting", "Website design", "Cement bags"] },
  { ask: "How many? Say quantity and unit.", hint: "Like 5 pieces, 10 hours", examples: ["5 pieces", "10 hours", "3 days"] },
  { ask: "What's the rate per unit?", hint: "In rupees", examples: ["500 rupees", "fifty thousand", "1000 per sqft"] },
]

const PARSE_QTY = (t: string) => {
  const m = t.match(/\d+/); if (m) return parseInt(m[0])
  const w: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, a: 1, an: 1 }
  for (const [k, v] of Object.entries(w)) if (t.includes(k)) return v
  return 1
}

const PARSE_RATE = (t: string) => {
  const m = t.match(/[\d,]+/); if (m) return parseInt(m[0].replace(/,/g, ""))
  return 0
}

const PARSE_UNIT = (t: string) => {
  if (/\d+\s*hours?/.test(t)) return "hours"
  if (/\d+\s*days?/.test(t)) return "days"
  if (/\d+\s*(pcs?|pieces?)/.test(t)) return "pcs"
  if (/\d+\s*(kg|kilograms?)/.test(t)) return "kg"
  if (/\d+\s*(sq\.?\s*ft\.?|square\s*feet)/.test(t)) return "sqft"
  if (/\d+\s*(sq\.?\s*m\.?|square\s*meter)/.test(t)) return "sqm"
  if (/\d+\s*bags?/.test(t)) return "bags"
  if (/\d+\s*sets?/.test(t)) return "sets"
  if (/\d+\s*(meters?|mtr?s?)/.test(t)) return "m"
  if (/\d+\s*(feet|ft)/.test(t)) return "ft"
  return "nos"
}

const LANGUAGES = [
  { code: "en-IN", label: "English (India)", flag: "🇮🇳" },
  { code: "hi-IN", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "ta-IN", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
  { code: "te-IN", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
  { code: "bn-IN", label: "বাংলা (Bengali)", flag: "🇮🇳" },
  { code: "mr-IN", label: "मराठी (Marathi)", flag: "🇮🇳" },
  { code: "gu-IN", label: "ગુજરાતી (Gujarati)", flag: "🇮🇳" },
  { code: "kn-IN", label: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
  { code: "ml-IN", label: "മലയാളം (Malayalam)", flag: "🇮🇳" },
  { code: "en-US", label: "English (US)", flag: "🇺🇸" },
]

export default function VoiceQuoteWizard() {
  const router = useRouter()
  const supabase = createClient()
  const [phase, setPhase] = useState<"intro" | "collecting" | "items" | "pricing" | "review" | "creating" | "done" | "error">("intro")
  const [stepIdx, setStepIdx] = useState(0)
  const [itemPrompt, setItemPrompt] = useState(0)
  const [pending, setPending] = useState<VoiceItem>({ description: "", quantity: "1", unit: "nos", rate: "" })
  const [items, setItems] = useState<VoiceItem[]>([])
  const [data, setData] = useState<Partial<QuoteData>>({ discountType: "percentage" })
  const [msgs, setMsgs] = useState<{ role: "ai" | "user"; text: string }[]>([])
  const [transcript, setTranscript] = useState("")
  const [listening, setListening] = useState(false)
  const [lang, setLang] = useState("en-IN")
  const [showLang, setShowLang] = useState(false)
  const [gstRate, setGstRate] = useState("18")
  const [errMsg, setErrMsg] = useState("")
  const recRef = useRef<any>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  const addMsg = useCallback((role: "ai" | "user", text: string) => {
    setMsgs(prev => [...prev, { role, text }])
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }, [])

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = 0.95
    window.speechSynthesis.speak(u)
  }, [lang])

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    setListening(true)
    setTranscript("")
    if (recRef.current) { try { recRef.current.stop() } catch {} }
    const rec = new (SR as any)()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = lang
    rec.onresult = (e: any) => {
      let final = "", interim = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      setTranscript(final || interim)
      if (final) handleInput(final.trim())
    }
    rec.onerror = () => { setListening(false); stopW() }
    rec.onend = () => { setListening(false); stopW() }
    recRef.current = rec
    startW()
    try { rec.start() } catch { rec.stop(); setTimeout(() => rec.start(), 100) }
  }

  const stopListening = () => { recRef.current?.stop(); setListening(false); stopW() }
  const toggle = () => { if (listening) { stopListening() } else { startListening() } }

  const startW = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    c.width = c.offsetWidth * 2
    c.height = c.offsetHeight * 2
    ctx.scale(2, 2)
    let tick = 0
    const draw = () => {
      if (!ctx || !c) return
      ctx.clearRect(0, 0, c.offsetWidth, c.offsetHeight)
      const bars = 40, bw = c.offsetWidth / bars
      for (let i = 0; i < bars; i++) {
        const h = listening ? Math.abs(Math.sin(tick * 0.2 + i * 0.3)) * 28 + 4 : 4
        const a = 0.3 + Math.abs(Math.sin(tick * 0.1 + i * 0.3)) * 0.3
        ctx.fillStyle = `rgba(99,102,241,${a})`
        ctx.beginPath()
        ctx.roundRect(i * bw + bw * 0.15, (c.offsetHeight - h) / 2, bw * 0.7, h, 3)
        ctx.fill()
      }
      tick++
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
  }

  const stopW = () => {
    cancelAnimationFrame(animRef.current)
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
  }

  function handleInput(text: string) {
    setListening(false); stopW()
    addMsg("user", text)
    const lower = text.toLowerCase().trim()

    if (phase === "intro") {
      setPhase("collecting"); setStepIdx(0)
      addMsg("ai", STEPS[0].ask); speak(STEPS[0].ask)
      return
    }

    if (lower === "skip" || lower === "next" || lower === "done" || lower === "no more items" || lower === "that's all") {
      if (phase === "items") {
        if (pending.description) {
          const final = { ...pending, quantity: pending.quantity || "1", unit: pending.unit || "nos", rate: pending.rate || "0" }
          setItems(prev => [...prev, final])
          addMsg("ai", `Added: ${final.description}`)
        }
        setPhase("pricing")
        addMsg("ai", "Now let's set GST. Default is 18 percent. What's your GST rate? Say 12 percent, 5 percent, or skip for 18%.")
        return
      }
    }

    if ((lower === "yes" || lower === "confirm" || lower === "create" || lower === "create it" || lower === "yes please" || lower === "proceed" || lower === "go ahead") && phase === "review") {
      createQuote(); return
    }
    if ((lower === "edit" || lower === "change" || lower === "fix" || lower === "no" || lower === "retry" || lower === "start over") && phase === "review") {
      setPhase("collecting"); setStepIdx(0); setItems([]); setData({})
      addMsg("ai", "Let's start fresh. Who is this quote for?"); speak("Who is this quote for?")
      return
    }
    if ((lower === "add item" || lower === "add another" || lower === "one more") && (phase === "pricing" || phase === "review")) {
      setPhase("items"); setItemPrompt(0); setPending({ description: "", quantity: "1", unit: "nos", rate: "" })
      addMsg("ai", "Sure, what item?"); return
    }
    if (lower === "remove last" || lower === "delete item" || lower === "undo") {
      if (items.length > 0) { setItems(prev => prev.slice(0, -1)); addMsg("ai", "Removed last item.") } return
    }

    if (phase === "collecting") {
      const step = STEPS[stepIdx]
      let parsed: any = {}

      if (step.id === "clientName") parsed = { clientName: text.trim() }
      else if (step.id === "clientPhone") parsed = { clientPhone: text.replace(/\D/g, "").slice(-10) }
      else if (step.id === "clientEmail") {
        if (["skip", "none", "no", "don't know", "not available"].some(s => lower.includes(s))) parsed = { clientEmail: "" }
        else { const m = text.match(/[\w.-]+@[\w.-]+\.\w+/); parsed = { clientEmail: m ? m[0] : "" } }
      }
      else if (step.id === "clientAddress") {
        if (["skip", "none", "no address", "not needed"].some(s => lower.includes(s))) parsed = { clientAddress: "" }
        else parsed = { clientAddress: text.trim() }
      }
      else if (step.id === "validTill") {
        const numWords: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, ninety: 90, a: 1 }
        const nm = lower.match(/\d+/)
        let days = 30
        if (nm) days = parseInt(nm[0])
        else { for (const [w, v] of Object.entries(numWords)) if (lower.includes(w)) { days = v; break } }
        const dt = new Date(); dt.setDate(dt.getDate() + days)
        parsed = { validTill: dt.toISOString().split("T")[0] }
      }

      if (!parsed[step.id]) { addMsg("ai", `I didn't catch that. ${step.hint}`); return }

      const upd = { ...data, ...parsed }
      setData(upd)
      const label = parsed.clientName || parsed.clientPhone || parsed.clientEmail || parsed.clientAddress || parsed.validTill
      addMsg("ai", label ? `Got it: ${label}. ${stepIdx < STEPS.length - 1 ? STEPS[stepIdx + 1].ask : "Now let's add items."}` : `Ok. ${stepIdx < STEPS.length - 1 ? STEPS[stepIdx + 1].ask : "Now let's add items."}`)

      if (stepIdx < STEPS.length - 1) setStepIdx(prev => prev + 1)
      else { setPhase("items"); setItemPrompt(0); setPending({ description: "", quantity: "1", unit: "nos", rate: "" }); addMsg("ai", "Now let's add items to this quote. What should I add first?") }
      return
    }

    if (phase === "items") {
      if (itemPrompt === 0) {
        if (["skip", "done", "no items", "nothing", "that's all", "nothing else"].some(s => lower.includes(s))) {
          if (items.length === 0) { addMsg("ai", "Please add at least one item. What's the first item?"); return }
          setPhase("pricing"); addMsg("ai", "GST rate? Default is 18 percent. Say your percentage or skip."); return
        }
        setPending(p => ({ ...p, description: text }))
        setItemPrompt(1); addMsg("ai", `${text}. How many units?`)
        return
      }
      if (itemPrompt === 1) {
        const qty = String(PARSE_QTY(text)), unit = PARSE_UNIT(text)
        setPending(p => ({ ...p, quantity: qty, unit }))
        setItemPrompt(2); addMsg("ai", `${qty} ${unit}. What's the rate per ${unit}?`)
        return
      }
      if (itemPrompt === 2) {
        const rate = String(PARSE_RATE(text))
        const final = { ...pending, quantity: pending.quantity || "1", unit: pending.unit || "nos", rate }
        setItems(prev => [...prev, final])
        addMsg("ai", `Added: ${final.description} — ${final.quantity} ${final.unit} @ ₹${parseInt(final.rate || "0").toLocaleString("en-IN")}. Add another or say done.`)
        setItemPrompt(0); setPending({ description: "", quantity: "1", unit: "nos", rate: "" })
        return
      }
      return
    }

    if (phase === "pricing") {
      if (["skip", "default", "keep", "18"].some(s => lower.includes(s))) {
        setGstRate("18")
        addMsg("ai", "GST at 18%. Ready to review your quote. Say yes to create, or add items first.")
        buildReview(); setPhase("review"); return
      }
      if (["no gst", "zero", "no tax", "0", "exempt"].some(s => lower.includes(s))) {
        setGstRate("0"); addMsg("ai", "No GST. Ready to review. Say yes to create.")
        buildReview(); setPhase("review"); return
      }
      const rm = lower.match(/(\d+)\s*(percent|%|$|rupees?|rs\.?)?/)
      if (rm) {
        setGstRate(rm[1]); addMsg("ai", `GST at ${rm[1]}%. Ready to review. Say yes to create.`)
        buildReview(); setPhase("review"); return
      }
      addMsg("ai", "Say a percentage like 12 percent, or skip for 18%."); return
    }
  }

  function buildReview() {
    const subtotal = items.reduce((s, i) => s + (parseInt(i.quantity) || 1) * (parseInt(i.rate) || 0), 0)
    const gst = Math.round(subtotal * (parseInt(gstRate) / 100))
    const total = subtotal + gst
    const summary = `Client: ${data.clientName || "Unknown"}${data.clientPhone ? `, Phone: ${data.clientPhone}` : ""}
Items: ${items.map(i => `• ${i.description} — ${i.quantity} ${i.unit} @ ₹${parseInt(i.rate || "0").toLocaleString("en-IN")}`).join(", ") || "None"}
Subtotal: ₹${subtotal.toLocaleString("en-IN")}
GST (${gstRate}%): ₹${gst.toLocaleString("en-IN")}
Total: ₹${total.toLocaleString("en-IN")}
Say "yes" to create, "add item" to add more, or "edit" to start over.`
    addMsg("ai", summary)
  }

  async function createQuote() {
    setPhase("creating"); addMsg("ai", "Creating your quote now...")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const subtotal = items.reduce((s, i) => s + (parseInt(i.quantity) || 1) * (parseInt(i.rate) || 0), 0)
      const gstAmt = Math.round(subtotal * (parseInt(gstRate) / 100))
      const total = subtotal + gstAmt

      const { data: cnt } = await supabase.from("quotes").select("quote_number").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1)
      const lastNum = cnt?.[0]?.quote_number
      const nextNum = lastNum ? parseInt(lastNum.replace(/\D/g, "")) + 1 : 1001
      const quote_number = `QT-${nextNum}`

      const { data: quote, error: qErr } = await supabase.from("quotes").insert({
        user_id: user.id, quote_number,
        client_name: data.clientName || "", client_phone: data.clientPhone || "",
        client_email: data.clientEmail || "", client_address: data.clientAddress || "",
        valid_till: data.validTill || null,
        subtotal: subtotal, discount: 0, discount_type: "percentage",
        gst_rate: parseInt(gstRate), gst_amount: gstAmt, total: total, status: "draft",
      }).select().single()

      if (qErr || !quote) throw new Error(qErr?.message || "Failed")

      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        await supabase.from("quote_items").insert({
          quote_id: quote.id, description: it.description,
          quantity: parseInt(it.quantity) || 1, unit: it.unit || "nos",
          rate: parseInt(it.rate || "0"),
          amount: (parseInt(it.quantity) || 1) * (parseInt(it.rate || "0")),
          sort_order: i,
        })
      }

      addMsg("ai", `Quote ${quote_number} created! Redirecting...`)
      speak(`Quote created successfully. Quote number ${quote_number}`)
      setPhase("done")
      setTimeout(() => router.push(`/quote/${quote.id}`), 2000)
    } catch (e: any) { setErrMsg(e.message); setPhase("error"); addMsg("ai", `Error: ${e.message}`) }
  }

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [msgs])

  function start() {
    setPhase("collecting"); setStepIdx(0); setItems([]); setData({}); setMsgs([])
    addMsg("ai", STEPS[0].ask); speak(STEPS[0].ask)
  }

  const step = STEPS[stepIdx]
  const subtotal = items.reduce((s, i) => s + (parseInt(i.quantity) || 1) * (parseInt(i.rate) || 0), 0)
  const total = subtotal + (Math.round(subtotal * (parseInt(gstRate) / 100)))
  const progress = phase === "collecting" ? ((stepIdx + 1) / STEPS.length) * 33 : phase === "items" ? 33 + (items.length / 2) * 33 : phase === "pricing" || phase === "review" ? 66 : 100

  useEffect(() => { if (listening) startW(); else stopW() }, [listening]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950 flex flex-col">
      <header className="p-4 flex items-center justify-between shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span className="text-sm">Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white/50">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="white" strokeWidth="1.5"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-white">Voice Quote</span>
          </div>
          <button onClick={() => setShowLang(!showLang)} className="text-white/50 hover:text-white text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <span>🌐</span>
            <span className="text-xs">{lang.split("-")[0].toUpperCase()}</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showLang && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-16 right-4 z-50 bg-slate-900 border border-white/10 rounded-2xl p-3 shadow-2xl w-64">
            <p className="text-xs text-white/30 font-semibold mb-2 px-2">Select your language</p>
            <div className="max-h-64 overflow-y-auto space-y-0.5">
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => { setLang(l.code); setShowLang(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-all ${lang === l.code ? "bg-indigo-600 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                  <span>{l.flag}</span><span className="text-xs">{l.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="px-6 shrink-0">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
        </div>
        <div className="flex justify-between mt-1.5">
          {["Client", "Items", "Review"].map((l, i) => (
            <span key={l} className={`text-[10px] font-medium ${i === 0 && phase === "collecting" || i === 1 && (phase === "items" || phase === "pricing") || i === 2 && (phase === "review" || phase === "creating" || phase === "done") ? "text-white" : "text-white/30"}`}>{l}</span>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full px-6 py-6">
        {/* Intro */}
        {phase === "intro" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
            <motion.div className="w-24 h-24 rounded-3xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center mb-8" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="#818cf8" strokeWidth="1.5"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#818cf8" strokeWidth="1.5"/>
                <line x1="12" y1="19" x2="12" y2="22" stroke="#818cf8" strokeWidth="1.5"/>
              </svg>
            </motion.div>
            <h1 className="text-3xl font-black text-white mb-3">Create Quote by Voice</h1>
            <p className="text-white/40 text-sm max-w-sm mb-2">Build professional quotes using just your voice. No typing needed.</p>
            <p className="text-indigo-400/50 text-xs mb-10">Supports English, Hindi, Tamil, Telugu & more</p>
            <div className="w-full max-w-xs space-y-2.5 text-left mb-8">
              {["🎤 Just speak — no typing required", "✅ AI confirms each detail before adding", "🌐 Works in English, Hindi & 8 more languages", "⚡ Creates quotes in under 2 minutes"].map(tip => (
                <div key={tip} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 text-sm text-white/60">
                  <span>{tip}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <button onClick={() => { start(); startListening() }} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="white" strokeWidth="1.5"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="1.5"/>
                </svg>
                Start Speaking
              </button>
              <Link href="/quote/new" className="flex-1 text-center bg-white/10 hover:bg-white/15 text-white font-medium py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
                Type instead
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Active phases */}
        {(phase === "collecting" || phase === "items" || phase === "pricing" || phase === "review") && (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-center mb-4">
              <canvas ref={canvasRef} className="w-full max-w-sm h-12 rounded-xl bg-white/5" style={{ height: "48px" }} />
            </div>
            {transcript && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-white/30 text-xs italic mb-3">
                &ldquo;{transcript}&rdquo;
              </motion.div>
            )}
            <div className="flex-1 overflow-y-auto space-y-2.5 mb-4 min-h-0">
              {msgs.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-white/10 text-white/90 border border-white/10"}`}>
                    {m.text.split("\n").map((l, li) => <p key={li} className={li > 0 ? "mt-1" : ""}>{l}</p>)}
                  </div>
                </motion.div>
              ))}
              {listening && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                  <div className="bg-red-500/20 border border-red-500/30 rounded-2xl px-5 py-3 text-sm text-red-300 flex items-center gap-2">
                    <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    Listening... Speak now
                  </div>
                </motion.div>
              )}
              <div ref={endRef} />
            </div>

            {/* Items summary */}
            {items.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                <p className="text-[10px] text-white/30 font-semibold mb-2 uppercase tracking-wider">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                {items.slice(-3).map((it, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-white/60 truncate">{it.description}</span>
                    <span className="text-white font-medium ml-2 shrink-0">₹{((parseInt(it.quantity) || 1) * (parseInt(it.rate) || 0)).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                {items.length > 3 && <p className="text-[10px] text-white/20">+{items.length - 3} more</p>}
                {subtotal > 0 && (
                  <div className="border-t border-white/10 mt-2 pt-2 flex justify-between text-sm">
                    <span className="text-white/40">Total</span>
                    <span className="text-white font-bold">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Hints */}
            <div className="text-center text-white/20 text-xs mb-3">
              {phase === "collecting" && step && `Try saying: "${step.examples[0]}"`}
              {phase === "items" && itemPrompt === 0 && "Say the item or skip to go to pricing"}
              {phase === "items" && itemPrompt === 1 && 'Try: "5 pieces" or "3 hours"'}
              {phase === "items" && itemPrompt === 2 && 'Try: "500 rupees" or "twenty thousand"'}
              {phase === "pricing" && 'Say "12 percent", "5 percent", or "skip" for 18%'}
              {phase === "review" && 'Say "yes" to create, "add item" to add more, or "edit" to start over'}
            </div>

            {/* Mic */}
            <div className="flex flex-col items-center gap-2">
              <motion.button onClick={toggle}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl ${listening ? "bg-red-500 hover:bg-red-600 shadow-red-900/50" : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50"}`}
                whileTap={{ scale: 0.92 }}
                animate={listening ? { scale: [1, 1.08, 1], transition: { duration: 0.6, repeat: Infinity } } : {}}>
                {listening ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="12" height="12" rx="3" fill="white"/></svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="white" strokeWidth="1.5"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="1.5"/>
                    <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="1.5"/>
                  </svg>
                )}
              </motion.button>
              <p className="text-white/20 text-xs">{listening ? "Tap to stop" : "Tap mic to speak"}</p>
            </div>
          </div>
        )}

        {/* Creating */}
        {phase === "creating" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
            <motion.div className="w-20 h-20 rounded-full bg-indigo-600/20 flex items-center justify-center mb-6" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="#818cf8" strokeWidth="1.5"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#818cf8" strokeWidth="1.5"/></svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Creating your quote...</h2>
            <p className="text-white/30 text-sm">Please wait a moment</p>
          </motion.div>
        )}

        {/* Done */}
        {phase === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
            <motion.div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6" initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-3">Quote Created!</h2>
            <p className="text-white/40 mb-8">Redirecting to your quote...</p>
            <div className="flex gap-3">
              <button onClick={() => router.push("/dashboard")} className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/15 transition-all text-sm">Dashboard</button>
              <button onClick={() => { setPhase("intro"); setMsgs([]); setItems([]); setData({}) }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all text-sm">Create Another</button>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {phase === "error" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="1.5"/><path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
            <p className="text-red-400 mb-8 text-sm max-w-sm">{errMsg}</p>
            <button onClick={() => { setPhase("intro"); setMsgs([]); setItems([]); setErrMsg("") }} className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/15 transition-all">Try Again</button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
