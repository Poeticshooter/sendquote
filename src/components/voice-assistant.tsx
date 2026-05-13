"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"

type Message = {
  role: "user" | "assistant"
  text: string
}

type ActionData = {
  route?: string
  action?: string
  data?: Record<string, string>
}

const LANDING_SUGGESTIONS = [
  "Tell me about SendQuote",
  "What features do you offer?",
  "How much does it cost?",
  "Is there a free plan?",
  "How do I get started?",
  "Do you support GST?",
]

const DASHBOARD_SUGGESTIONS = [
  "Create a quote for Rahul from Mumbai",
  "Show me my recent quotes",
  "Show my analytics",
  "Create an invoice from last quote",
  "Go to settings",
  "Show pending follow-ups",
]

function getLandingResponse(text: string): string {
  const lower = text.toLowerCase()

  if (lower.includes("tell me about") || lower.includes("what is") || lower.includes("about sendquote") || lower.includes("what do you")) {
    return "SendQuote is India's first professional quote-making platform designed for small businesses, contractors, and freelancers. You can create stunning quotes in 5 minutes, share them via WhatsApp, and get notified when your client opens them. No app download needed for clients — everything works on mobile browsers. We support GST calculations, branded PDFs, and one-tap client acceptance. Ready to see how it works?"
  }

  if (lower.includes("feature") || lower.includes("offer") || lower.includes("capabilities") || lower.includes("what can")) {
    return "Here's what SendQuote offers: Professional PDF quotes with your logo, Open tracking (know when clients view your quote), One-tap client acceptance, Smart auto follow-ups, WhatsApp & email sharing, GST-ready invoices (5%, 12%, 18%, 28%), Mobile-first client view, Bulk CSV export, and a beautiful dashboard to track everything. Would you like to explore any feature in detail?"
  }

  if (lower.includes("price") || lower.includes("cost") || lower.includes("plan") || lower.includes("pricing") || lower.includes("starter") || lower.includes("professional") || lower.includes("rupee") || lower.includes("₹")) {
    return "We have three plans:\n\nFree — 5 quotes/month with basic features. Perfect to try us out.\n\nStarter at ₹299/month — unlimited quotes, open tracking, branded PDFs, GST invoices, WhatsApp sharing, auto follow-ups, and one-tap client acceptance.\n\nProfessional at ₹799/month — everything in Starter plus up to 5 team members, custom branding, analytics dashboard, and bulk CSV export.\n\nAll paid plans come with a 7-day free trial. No credit card required!"
  }

  if (lower.includes("free") || lower.includes("trial") || lower.includes("start")) {
    return "Yes! Our Free plan gives you 5 quotes per month with basic features — perfect to try SendQuote before upgrading. You get the quote builder, shareable links, and PDF downloads. When you're ready for more (unlimited quotes, open tracking, GST invoices), upgrade to Starter at just ₹299/month. Click 'Get Started' above to create your free account!"
  }

  if (lower.includes("gst") || lower.includes("tax") || lower.includes("invoice")) {
    return "Absolutely! SendQuote has built-in GST support for Indian businesses. You can choose from standard GST rates: 0%, 5%, 12%, 18%, or 28%. Set your GST number in your profile settings and it automatically appears on all your quotes and invoices. The system calculates GST for you — no manual math needed!"
  }

  if (lower.includes("sign") || lower.includes("register") || lower.includes("account") || lower.includes("start") || lower.includes("begin") || lower.includes("get started")) {
    return "Getting started is easy! Just click 'Get Started' or 'Sign In' in the top navigation, create your free account in under a minute, and start creating professional quotes. You don't need a credit card for the free plan. Want to see it in action? Sign up and I'll guide you through your first quote!"
  }

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("namaste")) {
    return "Namaste! Welcome to SendQuote — India's professional quote platform for small businesses. I can tell you about our features, pricing, and how we help you close more deals. What would you like to know?"
  }

  if (lower.includes("thank")) {
    return "You're welcome! Ready to give SendQuote a try? Click 'Get Started' above to create your free account. Or ask me anything else about the product!"
  }

  return "I'd be happy to help! You can ask me about SendQuote features, pricing plans, GST support, how to get started, or anything else about the product. What interests you most?"
}

function getDashboardResponse(intent: string, data: Record<string, string>): { text: string; action?: ActionData } {
  const responses: Record<string, { text: string; action?: ActionData }> = {
    create_quote: { 
      text: `I'll open the quote creator${data.clientName ? ` for ${data.clientName}` : ""}. You can also say "for [client name]" to pre-fill the client.`, 
      action: { route: "/quote/new" } 
    },
    voice_quote: { 
      text: "Opening voice quote builder. Just speak naturally about what you need!", 
      action: { route: "/quote/voice" } 
    },
    invoice: { 
      text: "Go to any accepted quote and click 'Convert to Invoice' to create an invoice.", 
      action: { route: "/invoices" } 
    },
    last_accepted: { 
      text: "I'll find your most recent accepted quote and help convert it to invoice.", 
      action: { route: "/dashboard", action: "find_accepted" } 
    },
    show_quotes: { 
      text: "Taking you to your quotes dashboard. You can filter by status or search.", 
      action: { route: "/dashboard" } 
    },
    show_analytics: { 
      text: "Here's your analytics dashboard showing conversion rates, revenue trends, and more.", 
      action: { route: "/dashboard", action: "analytics" } 
    },
    show_invoices: { 
      text: "Opening your invoices list. Track payments and outstanding amounts here.", 
      action: { route: "/invoices" } 
    },
    settings: { 
      text: "Opening settings. Update your business details, logo, GST number, and more.", 
      action: { route: "/settings" } 
    },
    upgrade: { 
      text: "Let me show you our paid plans with more features!", 
      action: { route: "/upgrade" } 
    },
    pricing: { 
      text: "Here's our pricing: Free (5 quotes), Starter ₹299/mo (unlimited), Professional ₹799/mo (teams).", 
      action: { route: "/upgrade" } 
    },
    follow_ups: { 
      text: "These are quotes that need follow-up. I'll show you all pending quotes ready for a reminder.", 
      action: { route: "/dashboard", action: "follow_ups" } 
    },
    client_history: {
      text: "Let me show you past quotes for this client. This helps you see their history and suggest similar pricing.",
      action: { route: "/dashboard", action: "client_history" }
    },
    duplicate: {
      text: "I'll duplicate this quote so you can quickly create a similar one for another client.",
      action: { route: "/dashboard", action: "duplicate" }
    },
    share_whatsapp: {
      text: "Open any quote and click the WhatsApp button to share directly. No app needed for clients!",
      action: { route: "/dashboard" }
    },
    gst_help: {
      text: "GST is automatic! Set your GST rate (5%, 12%, 18%, or 28%) in settings. It calculates on every quote."
    },
    help: {
      text: "I can help you with:\n• Create quotes — \"create a quote for Rahul\"\n• Voice quotes — \"make a quote by voice\"\n• Convert to invoice\n• Show analytics\n• Follow-up reminders\n• View invoices\n• Change settings\n• Upgrade plan\n\nWhat would you like to do?"
    },
    general: {
      text: `I understand "${data.raw}". Try saying "create a quote", "show analytics", "go to settings", or "what are my follow-ups"?`
    }
  }

  return responses[intent] || responses.general
}

function detectCommand(text: string): string {
  const lower = text.toLowerCase()
  
  const patterns: { pattern: RegExp; action: string }[] = [
    { pattern: /create (a )?(voice )?quote/i, action: "voice_quote" },
    { pattern: /create (a )?quote/i, action: "create_quote" },
    { pattern: /make (a )?(voice )?quote/i, action: "voice_quote" },
    { pattern: /voice quote/i, action: "voice_quote" },
    { pattern: /convert (to )?invoice/i, action: "invoice" },
    { pattern: /invoice/i, action: "invoice" },
    { pattern: /last accepted|latest accepted|recent accepted/i, action: "last_accepted" },
    { pattern: /show (my )?quotes|view quotes|all quotes|recent quotes/i, action: "show_quotes" },
    { pattern: /show (my )?analytics|conversion|revenue|report/i, action: "show_analytics" },
    { pattern: /show (my )?invoices/i, action: "show_invoices" },
    { pattern: /settings?|preferences|profile|update business/i, action: "settings" },
    { pattern: /upgrade|paid plan|premium|pro/i, action: "upgrade" },
    { pattern: /price|cost|how much|plan/i, action: "pricing" },
    { pattern: /follow.?up|reminder|pending|need to follow/i, action: "follow_ups" },
    { pattern: /client history|past quotes|previous quote/i, action: "client_history" },
    { pattern: /duplicate|copy (this )?quote/i, action: "duplicate" },
    { pattern: /share|whatsapp/i, action: "share_whatsapp" },
    { pattern: /gst|tax|how does tax work/i, action: "gst_help" },
    { pattern: /help|what can you do|commands/i, action: "help" },
  ]

  for (const { pattern, action } of patterns) {
    if (pattern.test(text)) return action
  }
  return "general"
}

function parseVoiceCommand(text: string): { intent: string; data: Record<string, string> } {
  const intent = detectCommand(text)
  const data: Record<string, string> = { raw: text }

  const clientMatch = text.match(/(?:for |to |client\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)
  if (clientMatch) data.clientName = clientMatch[1]

  const cityMatch = text.match(/(?:from|in|at)\s+([A-Z][a-z]+)/)
  if (cityMatch) data.city = cityMatch[1]

  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
  if (emailMatch) data.email = emailMatch[0]

  const phoneMatch = text.match(/(\d{10})/)
  if (phoneMatch) data.phone = phoneMatch[0]

  const amountMatch = text.match(/(?:₹|rupees?|rs\.?\s*)?(\d+(?:,\d+)*)/i)
  if (amountMatch) data.amount = amountMatch[1].replace(/,/g, "")

  const qtyMatch = text.match(/(\d+)\s*(?:hours?|units?|pcs?|pieces?|kg|liters?)/i)
  if (qtyMatch) data.quantity = qtyMatch[1]

  return { intent, data }
}

export default function VoiceAssistant() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentText, setCurrentText] = useState("")
  const [transcript, setTranscript] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>(LANDING_SUGGESTIONS)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const waveformRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState(true)
  const [firstOpen, setFirstOpen] = useState(true)

  const isLanding = pathname === "/"
  const showAssistant = pathname === "/" || pathname.startsWith("/dashboard") || pathname.startsWith("/quote") || pathname.startsWith("/settings") || pathname.startsWith("/invoices")

  const handleAssistantResponseRef = useRef<((text: string) => Promise<void>) | null>(null)
  const startWaveformRef = useRef<(() => void) | null>(null)
  const stopWaveformRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    setSuggestions(isLanding ? LANDING_SUGGESTIONS : DASHBOARD_SUGGESTIONS)
    if (firstOpen && messages.length === 0) {
      setMessages([{
        role: "assistant",
        text: isLanding
          ? "Namaste! 👋 Welcome to SendQuote — India's professional quote platform for small businesses. I can tell you about our features, pricing, and how we help you close more deals. What would you like to know?"
          : "Hi! I'm your SendQuote assistant. I can help you create quotes, manage invoices, share on WhatsApp, and more. What would you like to do today?"
      }])
      setFirstOpen(false)
    }
  }, [isLanding, firstOpen, messages.length])

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setBrowserSupportsSpeech(false)
    } else {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = "en-IN"

      recognition.onresult = (event: any) => {
        let final = ""
        let interim = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript
          if (event.results[i].isFinal) final += t
          else interim += t
        }
        setTranscript(final || interim)
        if (final) {
          handleAssistantResponseRef.current?.(final.trim())
        }
      }

      recognition.onerror = () => {
        setListening(false)
        stopWaveformRef.current?.()
      }

      recognition.onend = () => {
        setListening(false)
        stopWaveformRef.current?.()
      }

      recognitionRef.current = recognition
    }

    return () => {
      stopWaveformRef.current?.()
      recognitionRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (listening) startWaveformRef.current?.()
    else stopWaveformRef.current?.()
  }, [listening])

  function startWaveform() {
    const canvas = waveformRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)
    const bars = 32
    const w = canvas.offsetWidth / bars
    let tick = 0

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      for (let i = 0; i < bars; i++) {
        const h = listening
          ? (Math.sin(tick * 0.3 + i * 0.4) * 0.5 + 0.5) * 28 + 4
          : 4
        const alpha = 0.4 + Math.sin(tick * 0.1 + i * 0.3) * 0.2
        ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`
        const x = i * w + w * 0.15
        const bw = w * 0.7
        ctx.beginPath()
        ctx.roundRect(x, (canvas.offsetHeight - h) / 2, bw, h, 3)
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

  const handleAssistantResponse = useCallback(async (text: string) => {
    setListening(false)
    setMessages(prev => [...prev, { role: "user", text }])

    if (isLanding) {
      const response = getLandingResponse(text)
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
      setMessages(prev => [...prev, { role: "assistant", text: response }])
      return
    }

    const { intent, data } = parseVoiceCommand(text)
    const { text: response, action } = getDashboardResponse(intent, data)

    await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
    setMessages(prev => [...prev, { role: "assistant", text: response }])

    if (action?.route) {
      await new Promise(r => setTimeout(r, 1200))
      router.push(action.route)
    }
  }, [isLanding, router])

  handleAssistantResponseRef.current = handleAssistantResponse
  startWaveformRef.current = startWaveform
  stopWaveformRef.current = stopWaveform

  function startListening() {
    if (!recognitionRef.current) return
    setTranscript("")
    setListening(true)
    try {
      recognitionRef.current.start()
    } catch {
      recognitionRef.current.stop()
      setTimeout(() => recognitionRef.current?.start(), 100)
    }
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
    stopWaveform()
  }

  function handleSuggestionClick(prompt: string) {
    setCurrentText(prompt)
    handleAssistantResponse(prompt)
  }

  if (!showAssistant) return null

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
                      <p className="text-white font-semibold text-sm">SendQuote Voice Assistant</p>
                      <p className="text-white/60 text-xs">Powered by AI</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {listening && (
                      <motion.span
                        className="flex items-center gap-1 text-xs text-white/80"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        Listening...
                      </motion.span>
                    )}
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
                    </div>
                  </motion.div>
                ))}

                {transcript && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 text-sm bg-indigo-100 text-indigo-800 border border-indigo-200 italic">
                      {transcript}
                      <motion.span
                        className="inline-block w-2 h-4 bg-indigo-400 ml-1"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
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

              {messages.length <= 2 && suggestions.length > 0 && (
                <div className="px-4 pb-2 bg-white border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                    {isLanding ? "Try asking:" : "Try saying:"}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestionClick(s)}
                        className="text-xs bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-200 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-4 pb-4 bg-white border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={currentText}
                      onChange={e => setCurrentText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && currentText.trim()) {
                          handleAssistantResponse(currentText.trim())
                          setCurrentText("")
                        }
                      }}
                      placeholder={browserSupportsSpeech ? "Type or speak..." : "Type your request..."}
                      className="w-full bg-slate-100 text-sm rounded-xl px-4 py-3 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                    />
                  </div>
                  {browserSupportsSpeech ? (
                    <motion.button
                      onClick={listening ? stopListening : startListening}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        listening
                          ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200"
                          : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                      }`}
                      whileTap={{ scale: 0.92 }}
                      animate={listening ? {
                        scale: [1, 1.1, 1],
                        transition: { duration: 0.6, repeat: Infinity }
                      } : {}}
                    >
                      {listening ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <rect x="6" y="6" width="12" height="12" rx="2" fill="white"/>
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
                      onClick={() => {
                        if (currentText.trim()) {
                          handleAssistantResponse(currentText.trim())
                          setCurrentText("")
                        }
                      }}
                      className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  )}
                </div>
                {!browserSupportsSpeech && (
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
