"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

type TourStep = {
  title: string
  description: string
  target: string
  position: "top" | "bottom" | "left" | "right"
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to SendQuote! 🎉",
    description: "Let's show you around and help you get started with creating professional quotes.",
    target: "body",
    position: "top",
  },
  {
    title: "Create Quotes",
    description: "Click here to create beautiful quotes in minutes using our voice or form builder.",
    target: "[data-tour='new-quote']",
    position: "bottom",
  },
  {
    title: "Use Templates",
    description: "Start fast with pre-built templates for common business scenarios like web development, events, and more.",
    target: "[data-tour='templates']",
    position: "bottom",
  },
  {
    title: "Track Everything",
    description: "See all your quotes and invoices in one place. Know when clients open them and track their status.",
    target: "[data-tour='dashboard']",
    position: "bottom",
  },
  {
    title: "Smart Assistant",
    description: "Need help? Click the voice assistant anytime to create quotes, get insights, or navigate the app.",
    target: "[data-tour='voice-assistant']",
    position: "top",
  },
  {
    title: "You're All Set! 🚀",
    description: "Start creating quotes and growing your business. Your clients will love how professional you look!",
    target: "body",
    position: "top",
  },
]

interface UserTourProps {
  onComplete?: () => void
}

export default function UserTour({ onComplete }: UserTourProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenTour, setHasSeenTour] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const tourSeen = localStorage.getItem("sendquote_tour_seen")
    if (!tourSeen) {
      setTimeout(() => {
        setIsOpen(true)
        setHasSeenTour(true)
      }, 1000)
    }
  }, [])

  function nextStep() {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      closeTour()
    }
  }

  function closeTour() {
    setIsOpen(false)
    localStorage.setItem("sendquote_tour_seen", "true")
    onComplete?.()
  }

  function skipTour() {
    closeTour()
  }

  if (!isOpen) return null

  const step = TOUR_STEPS[currentStep]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]">
        {/* Semi-transparent overlay */}
        <motion.div
          className="absolute inset-0 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={skipTour}
        />

        {/* Tour card */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] max-w-[90vw] bg-white rounded-3xl shadow-2xl p-6 z-10"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Progress dots */}
          <div className="flex gap-1.5 mb-4 justify-center">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep ? "bg-indigo-600 w-6" : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Icon based on step */}
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            {currentStep === 0 && (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
            )}
            {currentStep === 1 && (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
            {currentStep === 2 && (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            )}
            {currentStep === 3 && (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            )}
            {currentStep === 4 && (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" strokeWidth={2} />
              </svg>
            )}
            {currentStep === 5 && (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900 text-center mb-2">{step.title}</h3>
          <p className="text-sm text-slate-600 text-center leading-relaxed mb-6">{step.description}</p>

          <div className="flex gap-3">
            <button
              onClick={skipTour}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={nextStep}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              {currentStep === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Skip button in corner */}
        <button
          onClick={skipTour}
          className="absolute top-4 right-4 text-white/80 hover:text-white text-sm font-medium"
        >
          Skip tour
        </button>
      </div>
    </AnimatePresence>
  )
}