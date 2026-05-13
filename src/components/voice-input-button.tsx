"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface VoiceInputButtonProps {
  onResult: (text: string) => void
  placeholder?: string
  className?: string
  size?: "sm" | "md"
}

export default function VoiceInputButton({ onResult, placeholder = "Speak...", size = "sm" }: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [showHint, setShowHint] = useState(false)
  const recognitionRef = useRef<any>(null)

  function initRecognition() {
    if (recognitionRef.current) return recognitionRef.current
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return null
    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = "en-IN"
    rec.onresult = (event: any) => {
      let final = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) final += t
        else setTranscript(t)
      }
      if (final) {
        onResult(final.trim())
        setTranscript("")
      }
    }
    rec.onerror = () => { setListening(false) }
    rec.onend = () => { setListening(false) }
    recognitionRef.current = rec
    return rec
  }

  function toggle() {
    const rec = initRecognition()
    if (!rec) return
    if (listening) {
      rec.stop()
      setListening(false)
      setShowHint(false)
    } else {
      setTranscript("")
      setShowHint(true)
      setListening(true)
      try { rec.start() } catch { rec.stop(); setTimeout(() => rec.start(), 100) }
    }
  }

  const dim = size === "sm" ? "w-8 h-8" : "w-10 h-10"
  const iconDim = size === "sm" ? "w-4 h-4" : "w-5 h-5"

  return (
    <div className="relative inline-flex items-center">
      <motion.button
        type="button"
        onClick={toggle}
        title="Voice input"
        className={`${dim} rounded-lg flex items-center justify-center transition-all ${
          listening
            ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200"
            : "bg-slate-100 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600"
        }`}
        whileTap={{ scale: 0.9 }}
        animate={listening ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5, repeat: listening ? Infinity : 0 }}
      >
        {listening ? (
          <svg className={iconDim} viewBox="0 0 24 24" fill="none">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="white"/>
          </svg>
        ) : (
          <svg className={iconDim} viewBox="0 0 24 24" fill="none">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </motion.button>

      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs z-50 pointer-events-none"
          >
            <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-1.5">
              <motion.div
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              {listening ? "Listening..." : "Voice input"}
            </div>
            {listening && (
              <p className="text-slate-600 leading-relaxed">
                {transcript || <span className="italic text-slate-400">Speak now...</span>}
              </p>
            )}
            {!listening && (
              <p className="text-slate-500 leading-relaxed">
                Say things like: <br />
                <span className="text-slate-700 font-medium">&ldquo;Rahul Sharma&rdquo;</span> for names<br />
                <span className="text-slate-700 font-medium">&ldquo;five thousand rupees&rdquo;</span> for amounts
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
