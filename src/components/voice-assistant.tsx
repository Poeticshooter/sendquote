"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { useVoice } from "@/hooks/use-voice"
import { findBestIntent, processIntent, createInitialContext, VoiceContext, VoiceState } from "@/lib/voice-engine"
import { LANGUAGE_LABELS } from "@/lib/voice-locales"
import { nanoid } from "nanoid"

type Message = {
  role: "user" | "assistant"
  text: string
  confidence?: number
}

type SuggestionChip = {
  label: string
  text: string
}

const IDLE_SUGGESTIONS: SuggestionChip[] = [
  { label: "Create quote", text: "Create a new quote" },
  { label: "Show quotes", text: "Show my recent quotes" },
  { label: "Convert invoice", text: "Convert last quote to invoice" },
  { label: "Help", text: "What can you do?" },
]

const STATE_LABELS: Record<VoiceState, string> = {
  IDLE: "Ready",
  CREATING_QUOTE: "Creating quote...",
  ASKING_CLIENT: "Waiting for client name...",
  ASKING_EMAIL: "Waiting for client email...",
  ASKING_ITEMS: "Waiting for items...",
  ASKING_GST: "Waiting for GST rate...",
  ASKING_DISCOUNT: "Waiting for discount...",
  REVIEWING_QUOTE: "Reviewing quote...",
  CONFIRMING_SEND: "Confirming send...",
  LISTING_QUOTES: "Fetching quotes...",
  ASKING_QUOTE_NUMBER: "Waiting for quote number...",
}

const STORAGE_KEY = "sendquote-voice-context"

function loadSavedContext(): VoiceContext | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...createInitialContext(), ...parsed }
    }
  } catch { /* ignore */ }
  return null
}

function saveContext(ctx: VoiceContext) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx))
  } catch { /* ignore */ }
}

function clearSavedContext() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

export default function VoiceAssistant() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentText, setCurrentText] = useState("")
  const [lang, setLang] = useState("en-IN")
  const [voiceContext, setVoiceContext] = useState<VoiceContext>(createInitialContext)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [firstOpen, setFirstOpen] = useState(true)
  const [showLowConfidence, setShowLowConfidence] = useState(false)
  const [lastConfidence, setLastConfidence] = useState(0)

  const { transcript, interimTranscript, listening, supported, error, confidence: speechConfidence, start, stop, speak, reset } = useVoice(lang)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const waveformRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  const isLanding = pathname === "/"
  const showAssistant = pathname === "/" || pathname.startsWith("/dashboard") || pathname.startsWith("/quote") || pathname.startsWith("/settings") || pathname.startsWith("/invoices")

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("voice_language, voice_enabled, tts_rate").eq("user_id", user.id).single().then(({ data: prof }) => {
          if (prof) {
            if (prof.voice_language) setLang(prof.voice_language)
            if (prof.voice_enabled === false) setOpen(false)
          }
        })
      }
    })
  }, [supabase])

  useEffect(() => {
    const saved = loadSavedContext()
    if (saved && saved.state !== "IDLE") {
      setVoiceContext(saved)
    }
  }, [])

  useEffect(() => {
    if (firstOpen && messages.length === 0) {
      const saved = loadSavedContext()
      const greeting = isLanding
        ? "Namaste! Welcome to SendQuote. I can help you create quotes, check status, and more. What would you like to do?"
        : saved && saved.state !== "IDLE"
          ? `Welcome back! You were creating a quote for ${saved.pendingClientName || "a client"}. Say 'continue' to resume, or start fresh.`
          : "Hi! I'm your SendQuote voice assistant. Say 'create a quote' to get started, or tap the mic to speak."
      setMessages([{ role: "assistant", text: greeting }])
      setFirstOpen(false)
    }
  }, [isLanding, firstOpen, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    saveContext(voiceContext)
  }, [voiceContext])

  function startWaveform() {
    const canvas = waveformRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)
    const bars = 48
    const w = canvas.offsetWidth / bars
    let tick = 0

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      for (let i = 0; i < bars; i++) {
        const h = (Math.sin(tick * 0.3 + i * 0.4) * 0.5 + 0.5) * 28 + 4
        const alpha = 0.4 + Math.sin(tick * 0.1 + i * 0.3) * 0.2
        ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`
        ctx.beginPath()
        ctx.roundRect(i * w + w * 0.15, (canvas.offsetHeight - h) / 2, w * 0.7, h, 3)
        ctx.fill()
      }
      tick++
      animFrameRef.current = requestAnimationFrame(draw)
    }
    draw()
  }

  function stopWaveform() {
    cancelAnimationFrame(animFrameRef.current)
    const canvas = waveformRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
  }

  useEffect(() => {
    if (listening) startWaveform()
    else stopWaveform()
  }, [listening])

  const addAssistantMessage = useCallback((text: string, confidence?: number) => {
    setMessages(prev => [...prev, { role: "assistant", text, confidence }])
  }, [])

  const addUserMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: "user", text }])
  }, [])

  const handleAction = useCallback(async (action: string | undefined) => {
    if (!action) return

    if (action === 'fetch_quotes') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        addAssistantMessage("Please sign in to view your quotes.")
        return
      }
      const { data: quotes } = await supabase
        .from('quotes')
        .select('quote_number, client_name, status, total, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!quotes || quotes.length === 0) {
        addAssistantMessage("You don't have any quotes yet. Say 'create a quote' to get started.")
        return
      }

      const summary = quotes.map((q, i) => {
        const status = q.status.charAt(0).toUpperCase() + q.status.slice(1)
        return `${i + 1}. ${q.quote_number} for ${q.client_name} — ₹${Number(q.total).toLocaleString('en-IN')} (${status})`
      }).join('\n')

      addAssistantMessage(`Here are your recent quotes:\n${summary}`)

      const ttsText = `You have ${quotes.length} recent quotes. ${quotes.slice(0, 3).map((q, i) => `Quote ${q.quote_number} for ${q.client_name}, ${q.status}`).join('. ')}.`
      speak(ttsText, lang)
      return
    }

    if (action === 'save_draft') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        addAssistantMessage("Please sign in to save.")
        return
      }

      const subtotal = voiceContext.pendingItems.reduce((s, i) => s + i.quantity * i.rate, 0)
      const gstAmount = Math.round(subtotal * 0.18)
      const total = subtotal + gstAmount

      const { data: quoteNumber } = await supabase.rpc('next_quote_number', { p_user_id: user.id })

      const { data: quote, error: qErr } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          quote_number: quoteNumber || `QS-${Date.now().toString(36)}`,
          unique_token: nanoid(12),
          client_name: voiceContext.pendingClientName || '',
          client_email: voiceContext.pendingClientEmail || '',
          status: 'draft',
          subtotal,
          gst_rate: 18,
          gst_amount: gstAmount,
          total,
        })
        .select('id')
        .single()

      if (qErr || !quote) {
        addAssistantMessage("Failed to save quote. Please try again.")
        return
      }

      if (voiceContext.pendingItems.length > 0) {
        const itemsData = voiceContext.pendingItems.map((item, index) => ({
          quote_id: quote.id,
          description: item.description,
          quantity: item.quantity,
          unit: 'nos',
          rate: item.rate,
          amount: item.quantity * item.rate,
          sort_order: index,
        }))
        await supabase.from('quote_items').insert(itemsData)
      }

      addAssistantMessage(`Quote saved as draft! Quote ID: ${quote.id}`)
      speak("Quote saved as draft.", lang)
      setVoiceContext(createInitialContext)
      clearSavedContext()
      return
    }

    if (action === 'save_and_send') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        addAssistantMessage("Please sign in to send.")
        return
      }

      const subtotal = voiceContext.pendingItems.reduce((s, i) => s + i.quantity * i.rate, 0)
      const gstAmount = Math.round(subtotal * 0.18)
      const total = subtotal + gstAmount

      const { data: quoteNumber } = await supabase.rpc('next_quote_number', { p_user_id: user.id })

      const { data: quote, error: qErr } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          quote_number: quoteNumber || `QS-${Date.now().toString(36)}`,
          unique_token: nanoid(12),
          client_name: voiceContext.pendingClientName || '',
          client_email: voiceContext.pendingClientEmail || '',
          status: 'sent',
          subtotal,
          gst_rate: 18,
          gst_amount: gstAmount,
          total,
        })
        .select('id')
        .single()

      if (qErr || !quote) {
        addAssistantMessage("Failed to create quote.")
        return
      }

      if (voiceContext.pendingItems.length > 0) {
        const itemsData = voiceContext.pendingItems.map((item, index) => ({
          quote_id: quote.id,
          description: item.description,
          quantity: item.quantity,
          unit: 'nos',
          rate: item.rate,
          amount: item.quantity * item.rate,
          sort_order: index,
        }))
        await supabase.from('quote_items').insert(itemsData)
      }

      addAssistantMessage(`Quote created and sent! Opening it now...`)
      speak("Quote created and sent.", lang)
      setVoiceContext(createInitialContext)
      clearSavedContext()
      router.push(`/quote/${quote.id}`)
      return
    }

    if (action === 'send_quote') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        addAssistantMessage("Please sign in to send.")
        return
      }

      const subtotal = voiceContext.pendingItems.reduce((s, i) => s + i.quantity * i.rate, 0)
      const gstAmount = Math.round(subtotal * 0.18)
      const total = subtotal + gstAmount

      const { data: quoteNumber } = await supabase.rpc('next_quote_number', { p_user_id: user.id })

      const { data: quote, error: qErr } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          quote_number: quoteNumber || `QS-${Date.now().toString(36)}`,
          unique_token: nanoid(12),
          client_name: voiceContext.pendingClientName || '',
          client_email: voiceContext.pendingClientEmail || '',
          status: 'sent',
          subtotal,
          gst_rate: 18,
          gst_amount: gstAmount,
          total,
        })
        .select('id')
        .single()

      if (qErr || !quote) {
        addAssistantMessage("Failed to send quote.")
        return
      }

      if (voiceContext.pendingItems.length > 0) {
        const itemsData = voiceContext.pendingItems.map((item, index) => ({
          quote_id: quote.id,
          description: item.description,
          quantity: item.quantity,
          unit: 'nos',
          rate: item.rate,
          amount: item.quantity * item.rate,
          sort_order: index,
        }))
        await supabase.from('quote_items').insert(itemsData)
      }

      addAssistantMessage("Quote sent successfully!")
      speak("Quote sent successfully.", lang)
      setVoiceContext(createInitialContext)
      clearSavedContext()
      return
    }

    if (action === 'show_status') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        addAssistantMessage("Please sign in to check status.")
        return
      }
      const { data: quotes } = await supabase
        .from('quotes')
        .select('status')
        .eq('user_id', user.id)
      const counts: Record<string, number> = {}
      quotes?.forEach(q => { counts[q.status] = (counts[q.status] || 0) + 1 })
      const summary = Object.entries(counts).map(([s, c]) => `${c} ${s}`).join(', ')
      addAssistantMessage(`Your quote status: ${summary || "No quotes yet."}`)
      return
    }

    if (action.startsWith('convert_invoice:')) {
      const quoteNum = action.split(':')[1]
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        addAssistantMessage("Please sign in to convert.")
        return
      }
      const { data: quote } = await supabase
        .from('quotes')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('quote_number', quoteNum)
        .single()

      if (!quote) {
        addAssistantMessage(`Quote ${quoteNum} not found.`)
        return
      }
      if (quote.status !== 'accepted') {
        addAssistantMessage(`Quote ${quoteNum} must be accepted before converting to invoice.`)
        return
      }
      const { data: invoiceId } = await supabase.rpc('create_invoice_from_quote', { p_quote_id: quote.id })
      if (invoiceId) {
        addAssistantMessage(`Quote ${quoteNum} converted to invoice!`)
        speak("Converted to invoice.", lang)
        router.push(`/invoices`)
      } else {
        addAssistantMessage("Failed to convert to invoice.")
      }
      return
    }

    if (action.startsWith('set_gst:')) {
      const rate = parseFloat(action.split(':')[1])
      addAssistantMessage(`GST set to ${rate}%.`)
      return
    }

    if (action.startsWith('set_discount:')) {
      const value = parseFloat(action.split(':')[1])
      addAssistantMessage(`Discount set to ${value}%.`)
      return
    }
  }, [voiceContext, supabase, router, speak, lang, addAssistantMessage])

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim() || processing) return
    setProcessing(true)
    stop()
    reset()
    addUserMessage(text)

    await new Promise(r => setTimeout(r, 400 + Math.random() * 300))

    if (isLanding) {
      const lower = text.toLowerCase()
      let response = "I'd be happy to help! Click 'Get Started' to create your free account."
      if (lower.includes('feature') || lower.includes('offer')) {
        response = "SendQuote offers: Professional PDF quotes, Open tracking, One-tap client acceptance, GST-ready invoices, WhatsApp & email sharing, and a beautiful dashboard."
      } else if (lower.includes('price') || lower.includes('cost') || lower.includes('plan')) {
        response = "Free — 5 quotes/month. Starter at ₹299/month — unlimited quotes. Professional at ₹799/month — teams and analytics."
      } else if (lower.includes('gst') || lower.includes('tax')) {
        response = "SendQuote has built-in GST support. Choose from 0%, 5%, 12%, 18%, or 28%. Set your GST number in settings."
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('namaste')) {
        response = "Namaste! Welcome to SendQuote. What would you like to know?"
      }
      addAssistantMessage(response)
      speak(response, lang)
      setProcessing(false)
      return
    }

    const { intent, confidence: matchConfidence } = findBestIntent(text, lang)
    setLastConfidence(matchConfidence)

    if (matchConfidence < 0.5) {
      setShowLowConfidence(true)
      addAssistantMessage("I didn't quite catch that. Could you rephrase?", matchConfidence)
      speak("I didn't quite catch that.", lang)
      setProcessing(false)
      return
    }

    setShowLowConfidence(false)
    const result = processIntent(intent, voiceContext, text, lang)
    setVoiceContext(result.newContext)
    addAssistantMessage(result.response, matchConfidence)
    speak(result.response, lang)

    if (result.action) {
      await handleAction(result.action)
    }

    setProcessing(false)
  }, [voiceContext, lang, isLanding, processing, stop, reset, addUserMessage, addAssistantMessage, speak, handleAction])

  useEffect(() => {
    if (transcript) {
      processTranscript(transcript)
    }
  }, [transcript, processTranscript])

  const handleMicToggle = useCallback(() => {
    if (listening) {
      stop()
    } else {
      reset()
      start()
    }
  }, [listening, start, stop, reset])

  const handleTextSubmit = useCallback(() => {
    if (currentText.trim()) {
      processTranscript(currentText.trim())
      setCurrentText("")
    }
  }, [currentText, processTranscript])

  const handleSuggestionClick = useCallback((text: string) => {
    processTranscript(text)
  }, [processTranscript])

  const handleRetry = useCallback((text: string) => {
    setShowLowConfidence(false)
    processTranscript(text)
  }, [processTranscript])

  const getSuggestions = useCallback((): SuggestionChip[] => {
    if (showLowConfidence) {
      return [
        { label: "Create quote", text: "Create a new quote" },
        { label: "Show quotes", text: "Show my recent quotes" },
        { label: "Help", text: "What can you do?" },
      ]
    }
    switch (voiceContext.state) {
      case 'IDLE':
        return IDLE_SUGGESTIONS
      case 'ASKING_EMAIL':
        return [
          { label: "Skip email", text: "Skip" },
          { label: "Type email", text: "client@example.com" },
          { label: "Cancel", text: "Cancel" },
        ]
      case 'ASKING_ITEMS':
        return [
          { label: "Add item", text: "Add cement 50 bags at 350" },
          { label: "Done", text: "Done adding items" },
          { label: "Cancel", text: "Cancel" },
        ]
      case 'CONFIRMING_SEND':
        return [
          { label: "Yes, send", text: "Yes" },
          { label: "No, cancel", text: "No" },
        ]
      default:
        return IDLE_SUGGESTIONS
    }
  }, [voiceContext.state, showLowConfidence])

  useEffect(() => {
    function handleVoiceCommand(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail?.text) {
        processTranscript(detail.text)
      }
    }

    window.addEventListener('sendquote-voice-command', handleVoiceCommand)
    return () => window.removeEventListener('sendquote-voice-command', handleVoiceCommand)
  }, [processTranscript])

  useEffect(() => {
    if (voiceContext.pendingClientName || voiceContext.pendingItems.length > 0) {
      window.dispatchEvent(new CustomEvent('sendquote-voice-update', {
        detail: {
          clientName: voiceContext.pendingClientName,
          items: voiceContext.pendingItems,
          state: voiceContext.state,
        }
      }))
    }
  }, [voiceContext.pendingClientName, voiceContext.pendingItems, voiceContext.state])

  if (!showAssistant) return null

  const waveformColor = listening ? 'rgba(99, 102, 241, ' : processing ? 'rgba(251, 191, 36, ' : 'rgba(148, 163, 184, '

  return (
    <>
      <motion.button
        data-tour="voice-assistant"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl shadow-lg shadow-indigo-300/60 hover:shadow-xl hover:shadow-indigo-300/70 hover:scale-105 transition-all flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Voice Assistant"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-24 left-6 w-[420px] max-w-[calc(100vw-48px)] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              aria-live="polite"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="white" strokeWidth="1.5"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="1.5"/>
                        <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="1.5"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Voice Assistant</p>
                      <p className="text-white/60 text-xs">{STATE_LABELS[voiceContext.state]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowLangPicker(!showLangPicker)}
                        className="text-xs text-white/80 bg-white/10 px-2 py-1 rounded-lg hover:bg-white/20:bg-white/30 transition-colors"
                      >
                        {LANGUAGE_LABELS[lang] || 'English'}
                      </button>
                      <AnimatePresence>
                        {showLangPicker && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 w-40 z-50"
                          >
                            {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                              <button
                                key={code}
                                onClick={() => { setLang(code); setShowLangPicker(false) }}
                                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-indigo-50:bg-indigo-900/20 transition-colors ${
                                  code === lang ? 'text-indigo-600 font-medium' : 'text-slate-700'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button
                      onClick={() => setOpen(false)}
                      className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-80 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mr-2 mt-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="white" strokeWidth="2"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2"/>
                        </svg>
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-md"
                        : "bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm"
                    }`}>
                      {msg.text.split("\n").map((line, li) => (
                        <p key={li} className={li > 0 ? "mt-2" : ""}>{line}</p>
                      ))}
                      {msg.confidence !== undefined && msg.role === "assistant" && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className={`h-1.5 w-16 rounded-full ${
                            msg.confidence >= 0.8 ? 'bg-emerald-400' :
                            msg.confidence >= 0.6 ? 'bg-amber-400' : 'bg-red-400'
                          }`} />
                          <span className="text-[10px] text-slate-400">{Math.round(msg.confidence * 100)}% match</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {interimTranscript && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 text-sm bg-indigo-50 text-indigo-600 border border-indigo-100 italic">
                      {interimTranscript}
                      <motion.span
                        className="inline-block w-2 h-4 bg-indigo-400 ml-1"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    </div>
                  </motion.div>
                )}

                {processing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mr-2 mt-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="white" strokeWidth="2"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <motion.div
                          className="w-2 h-2 bg-indigo-400 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-indigo-400 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-indigo-400 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        />
                        <span className="text-xs text-slate-400 ml-1">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {showLowConfidence && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center"
                  >
                    <div className="bg-amber-50 text-amber-700 text-xs px-4 py-3 rounded-xl border border-amber-200 max-w-[90%]">
                      <p className="font-medium mb-1">Not sure I understood</p>
                      <p className="text-amber-600 mb-2">Try one of these:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Create a new quote", "Show my recent quotes", "What can you do?"].map(s => (
                          <button
                            key={s}
                            onClick={() => handleRetry(s)}
                            className="text-xs bg-amber-100 hover:bg-amber-200:bg-amber-700/40 text-amber-800 px-2.5 py-1 rounded-full transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center"
                  >
                    <div className="bg-amber-50 text-amber-700 text-xs px-4 py-2 rounded-lg border border-amber-200">
                      {error}
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="px-4 py-2 bg-white border-t border-slate-100">
                <canvas
                  ref={waveformRef}
                  className="w-full h-8"
                  style={{ height: "32px" }}
                />
              </div>

              <div className="px-4 pb-2 bg-white border-t border-slate-100">
                <div className="flex flex-wrap gap-1.5 py-2">
                  {getSuggestions().map((chip) => (
                    <button
                      key={chip.text}
                      onClick={() => handleSuggestionClick(chip.text)}
                      className="text-xs bg-slate-100 hover:bg-indigo-50:bg-indigo-900/20 text-slate-600 hover:text-indigo-600:text-indigo-400 px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-200:border-indigo-700 transition-all"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 pb-4 bg-white border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={currentText}
                      onChange={e => setCurrentText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && currentText.trim()) {
                          handleTextSubmit()
                        }
                      }}
                      placeholder={supported ? "Type or speak..." : "Type your request..."}
                      className="w-full bg-slate-100 text-sm rounded-xl px-4 py-3 pr-12 text-slate-900 placeholder:text-slate-400:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-300:ring-indigo-700 transition-all"
                    />
                  </div>
                  {supported ? (
                    <motion.button
                      onClick={handleMicToggle}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        listening
                          ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200"
                          : processing
                            ? "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200"
                            : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                      }`}
                      whileTap={{ scale: 0.92 }}
                      animate={listening ? {
                        scale: [1, 1.1, 1],
                        transition: { duration: 0.6, repeat: Infinity }
                      } : processing ? {
                        scale: [1, 1.05, 1],
                        transition: { duration: 1, repeat: Infinity }
                      } : {}}
                    >
                      {listening ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <rect x="6" y="6" width="12" height="12" rx="2" fill="white"/>
                        </svg>
                      ) : processing ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="3" fill="white"/>
                          <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5" opacity="0.5"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="white" strokeWidth="1.5"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="1.5"/>
                          <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="1.5"/>
                        </svg>
                      )}
                    </motion.button>
                  ) : (
                    <button
                      onClick={handleTextSubmit}
                      className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  )}
                </div>
                {!supported && (
                    <p className="text-[10px] text-amber-600 mt-1.5">
                    Voice not supported in this browser. Type your request above.
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
