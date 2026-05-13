"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"

type Message = {
  role: "user" | "assistant"
  content: string
}

const QUICK_ACTIONS = [
  { label: "Create a quote", icon: "📝", action: "How do I create a new quote?" },
  { label: "Share on WhatsApp", icon: "📱", action: "How do I share a quote on WhatsApp?" },
  { label: "Invoice from quote", icon: "📄", action: "How do I convert a quote to invoice?" },
  { label: "GST setup", icon: "🧾", action: "How does GST work?" },
  { label: "Track opens", icon: "👀", action: "How does open tracking work?" },
  { label: "Upgrade plan", icon: "⬆️", action: "How do I upgrade my plan?" },
]

const ESCALATION_QUESTIONS = [
  "pricing", "plan", "upgrade", "cost", "price", "rupee", "₹", "payment",
  "cancel", "refund", "support", "bug", "error", "problem",
]

const BUSINESS_KEYWORDS = [
  "quote", "quotation", "invoice", "billing", "gst", "tax", "client", "customer",
  "pdf", "download", "share", "whatsapp", "email", "send", "create", "edit",
  "delete", "draft", "sent", "accepted", "rejected", "expired", "open tracking",
  "payment", "pricing", "plan", "upgrade", "subscription", "cancel", "free",
  "starter", "professional", "features", "limit", "template", "item", "line item",
  "discount", "gst rate", "total", "subtotal", "notes", "terms", "payment terms",
  "valid till", "expiry", "status", "archive", "restore", "dashboard", "settings",
  "profile", "business name", "logo", "phone", "address", "sendquote",
  "accept", "request changes", "bulk", "export", "csv", "api", "team",
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning!"
  if (hour < 17) return "Good afternoon!"
  return "Good evening!"
}

function generateResponse(text: string, _messages: Message[]): string {
  const lower = text.toLowerCase()

  if (!BUSINESS_KEYWORDS.some(k => lower.includes(k))) {
    return "I'm a SendQuote assistant and can only help with questions about quotes, invoices, GST, pricing, and related topics. Could you ask about something related to SendQuote?"
  }

  if (ESCALATION_QUESTIONS.some(k => lower.includes(k))) {
    return "That's a great question. For detailed help with plans, billing, or payments, please email us at support@sendquote.in — we respond within 24 hours."
  }

  if (lower.includes("how do i create") || lower.includes("create a quote") || lower.includes("new quote")) {
    return "Click 'New Quote' on your dashboard. Fill in your client's name and contact details, add line items (description, quantity, rate), set the GST rate, then save. You can share the link via WhatsApp or email instantly."
  }

  if (lower.includes("whatsapp") || lower.includes("share link") || lower.includes("share url")) {
    return "On the quote detail page, click 'Share with client' to copy the link or send directly via WhatsApp. The WhatsApp button opens the app with a pre-filled message including your quote link."
  }

  if (lower.includes("pdf") || lower.includes("download") || lower.includes("print")) {
    return "Every quote has a PDF button in the header. Click it to download a professional PDF with your logo, client details, line items with GST breakdown, and totals. PDFs are generated instantly."
  }

  if (lower.includes("template") || lower.includes("templates") || lower.includes("reuse")) {
    return "You can reuse line items from past quotes — just start typing a description and I'll suggest matching items from your history with their unit and rate."
  }

  if (lower.includes("gst") || lower.includes("tax") || lower.includes("rate")) {
    return "Set a GST rate per quote in the Pricing step — common options are 0%, 5%, 12%, 18%, or 28%. The system automatically calculates GST and adds it to your total. It appears on the PDF."
  }

  if (lower.includes("discount")) {
    return "Apply discounts as a percentage or fixed amount in the Pricing step. The discount shows separately on the quote and PDF so your client clearly sees the original price and the saving."
  }

  if (lower.includes("invoice") || lower.includes("invoices")) {
    return "Convert an accepted quote to an invoice from the quote detail page. Invoices include the same items and pricing plus payment tracking for partial or full payments."
  }

  if (lower.includes("accept") || lower.includes("accepted") || lower.includes("reject") || lower.includes("changes")) {
    return "When your client opens the quote link, they see 'Accept Quote' and 'Request Changes' buttons. Their response appears in the Activity section of your quote detail page."
  }

  if (lower.includes("multi") || lower.includes("multiple") || lower.includes("bulk") || lower.includes("import")) {
    return "Currently SendQuote creates quotes one at a time. The Professional plan includes CSV import/export for bulk operations. Email support@sendquote.in to learn more."
  }

  if (lower.includes("team") || lower.includes("member") || lower.includes("collaborat") || lower.includes("user")) {
    return "The Professional plan supports up to 5 team members who can create and manage quotes together. Contact support@sendquote.in to join the waitlist for team features."
  }

  if (lower.includes("payment term") || lower.includes("payment details")) {
    return "Set custom payment terms in the quote wizard — for example '50% advance, 50% on delivery' or 'Net 30'. These appear clearly on the quote and PDF."
  }

  if (lower.includes("thank") || lower.includes("thanks")) {
    return "You're welcome! Is there anything else about SendQuote I can help you with?"
  }

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return `${getGreeting()} I'm your SendQuote assistant. Ask me about creating quotes, WhatsApp sharing, GST, invoices, tracking, or any feature. How can I help?`
  }

  return "I can help with questions about creating quotes, WhatsApp sharing, GST, invoices, open tracking, plans, and billing. Could you rephrase your question? For example, try 'How do I create a quote?' or 'How does GST work?'"
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [recording, setRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleSend = (text?: string) => {
    const textToSend = (text || input).trim()
    if (!textToSend) return

    const userMsg: Message = { role: "user", content: textToSend }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    const delay = 600 + ((messages.length % 3) + 1) * 100
    setTimeout(() => {
      const response = generateResponse(textToSend, [...messages, userMsg])
      setMessages(prev => [...prev, { role: "assistant", content: response }])
      setIsTyping(false)
    }, delay)
  }

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMessages(prev => [...prev, { role: "assistant", content: "Voice input isn't supported in this browser. Please try Chrome or Edge, or type your question." }])
      return
    }

    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-IN"

    recognition.onstart = () => setRecording(true)
    recognition.onend = () => setRecording(false)
    recognition.onerror = () => {
      setRecording(false)
      setMessages(prev => [...prev, { role: "assistant", content: "I didn't catch that. Could you type your question?" }])
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      handleSend(transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const showWelcome = messages.length === 0

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-300/60 hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Chat with support"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        )}
      </motion.button>

      {open && (
        <motion.div
          className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">SendQuote Support</p>
                <p className="text-white/60 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Typically replies in minutes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50 min-h-[280px] max-h-[400px]">
            {showWelcome ? (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">How can I help you?</p>
                  <p className="text-xs text-slate-500 mt-0.5">I can answer questions about quotes, GST, invoices, and more.</p>
                </div>

                {/* Quick action grid */}
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleSend(action.action)}
                      className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left group"
                    >
                      <span className="text-base">{action.icon}</span>
                      <span className="text-xs font-medium text-slate-700 group-hover:text-indigo-700">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-md"
                        : "bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm"
                    }`}>
                      {msg.content.split(". ").map((sentence, si) => (
                        <p key={si} className={si > 0 ? "mt-2" : ""}>{sentence}{sentence.endsWith(".") ? "" : "."}</p>
                      ))}
                      {msg.role === "assistant" && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100">
                          <p className="text-[11px] text-slate-400">Was this helpful?</p>
                          <div className="flex gap-2 mt-1">
                            <button className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors">
                              👍 Yes
                            </button>
                            <button className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors">
                              👎 No
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-slate-400"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Ask anything about SendQuote..."
                  className="w-full bg-slate-100 text-sm rounded-xl px-4 py-2.5 pr-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                />
              </div>
              <button
                onClick={handleVoiceInput}
                title="Voice input"
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  recording
                    ? "bg-red-500 text-white shadow-lg shadow-red-200"
                    : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                {recording ? (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <rect x="6" y="6" width="12" height="12" rx="2" fill="white"/>
                    </svg>
                  </motion.div>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              For billing & plan issues:{" "}
              <a href="mailto:support@sendquote.in" className="text-indigo-500 hover:text-indigo-600 font-medium">
                support@sendquote.in
              </a>
            </p>
          </div>
        </motion.div>
      )}
    </>
  )
}
