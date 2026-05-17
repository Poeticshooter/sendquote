"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/toast"

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
  currentPage?: string
}

const CATEGORIES = [
  { value: "bug", label: "Bug", emoji: "🐛" },
  { value: "feature", label: "Feature Request", emoji: "💡" },
  { value: "ui", label: "UI/UX", emoji: "🎨" },
  { value: "other", label: "Other", emoji: "💬" },
]

export default function FeedbackModal({ open, onClose, currentPage = "" }: FeedbackModalProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [category, setCategory] = useState("bug")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleSubmit = useCallback(async () => {
    if (!message.trim()) {
      toast("Please enter a message", "error")
      return
    }

    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from("feedback").insert({
      user_id: user?.id || null,
      message: message.trim(),
      rating: rating > 0 ? rating : null,
      category,
      page: currentPage,
      metadata: { userAgent: navigator.userAgent },
    })

    if (error) {
      toast("Failed to send feedback", "error")
    } else {
      toast("Thank you for your feedback!", "success")
      setRating(0)
      setCategory("bug")
      setMessage("")
      onClose()
    }
    setSubmitting(false)
  }, [message, rating, category, currentPage, supabase, toast, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose()
  }, [onClose])

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onKeyDown={handleKeyDown}
          >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Give Feedback</h2>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">How was your experience?</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="text-2xl transition-transform hover:scale-110"
                        type="button"
                      >
                        {star <= (hoveredRating || rating) ? "⭐" : "☆"}
                      </button>
                    ))}
                    {(hoveredRating || rating) > 0 && (
                      <span className="text-xs text-slate-500 ml-2">
                        {rating <= 2 ? "Not great" : rating <= 3 ? "Okay" : rating <= 4 ? "Good" : "Excellent!"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        type="button"
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-xs ${
                          category === cat.value
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 hover:border-slate-300 text-slate-600"
                        }`}
                      >
                        <span className="text-lg">{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 text-sm resize-none"
                    placeholder="Tell us what you think, found a bug, or have a feature request..."
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {message.length}/500 characters
                  </p>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !message.trim()}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
                  >
                    {submitting ? "Sending..." : "Send Feedback"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
