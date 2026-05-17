"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion"
import BrandLogo from "@/components/brand-logo"
import Button from "@/components/ui/button"
import ThemeToggle from "@/components/theme-toggle"
import { FloatingOrb, Floating3DCube, FloatingDocument, FloatingCoin, FloatingCheck } from "./animations"

export default function HeroSection() {
  const heroRef = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96])
  const orb1Y = useTransform(scrollYProgress, [0, 1], [0, -80])
  const orb2Y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const shape1X = useTransform(mouseX, [-1, 1], [-20, 20])
  const shape1Y = useTransform(mouseY, [-1, 1], [-15, 15])
  const shape2X = useTransform(mouseX, [-1, 1], [15, -15])
  const shape2Y = useTransform(mouseY, [-1, 1], [20, -20])

  return (
    <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-slate-900">
      {/* Dot grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #0f172a 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Animated orbs */}
      <motion.div style={{ y: orb1Y }} className="absolute inset-0 pointer-events-none">
        <FloatingOrb className="w-[600px] h-[600px] bg-indigo-300 top-[-200px] left-[-150px]" delay={0} />
        <FloatingOrb className="w-[500px] h-[500px] bg-emerald-300 bottom-[-150px] right-[-100px]" delay={2} />
        <FloatingOrb className="w-[300px] h-[300px] bg-violet-300 top-[20%] right-[10%]" delay={4} />
      </motion.div>
      <motion.div style={{ y: orb2Y }} className="absolute inset-0 pointer-events-none">
        <FloatingOrb className="w-[400px] h-[400px] bg-amber-200 top-[40%] left-[5%]" delay={1} />
        <FloatingOrb className="w-[350px] h-[350px] bg-pink-200 top-[60%] right-[20%]" delay={3} />
      </motion.div>

      {/* Mouse-parallax floating shapes */}
      <motion.div
        style={{ x: shape1X, y: shape1Y }}
        className="absolute top-32 right-[8%] w-14 h-14 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl rotate-12 opacity-50"
        animate={{ rotate: [12, 20, 12], y: [0, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{ x: shape2X, y: shape2Y }}
        className="absolute top-[45%] left-[6%] w-10 h-10 bg-emerald-200 dark:bg-emerald-800 rounded-full opacity-40"
        animate={{ y: [0, -20, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-32 left-[12%] w-14 h-14 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl -rotate-12 opacity-30"
        animate={{ rotate: [-12, -20, -12], y: [0, 15, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute top-[30%] right-[18%] w-8 h-8 bg-violet-200 dark:bg-violet-800 rounded-lg rotate-45 opacity-30"
        animate={{ rotate: [45, 55, 45], scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* 3D Floating Elements */}
      <Floating3DCube className="top-[15%] left-[15%] w-16 h-16" delay={0} />
      <FloatingDocument className="top-[60%] right-[5%]" delay={1} />
      <FloatingCoin className="top-[25%] left-[60%]" delay={2} />
      <FloatingCheck className="bottom-[25%] left-[20%]" delay={0.5} />

      {/* Hero content */}
      <motion.div
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 text-center max-w-4xl mx-auto px-6 pt-32 pb-24"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          mouseX.set((e.clientX - rect.left - rect.width / 2) / rect.width)
          mouseY.set((e.clientY - rect.top - rect.height / 2) / rect.height)
        }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
          className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium px-4 py-1.5 rounded-full mb-10 border border-slate-200 dark:border-slate-700"
        >
          <motion.span
            className="w-2 h-2 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          Built for Indian small businesses
        </motion.div>

        {/* Main headline */}
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] text-slate-900 dark:text-white mb-8"
          initial="hidden"
          animate="visible"
        >
          {["Send quotes that ", "close deals", " — not get ignored."].map((line, li) => (
            <motion.span
              key={li}
              className="inline-block mr-2"
              variants={{
                hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)" },
              }}
              transition={{ duration: 0.7, delay: 0.2 + li * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {line === "close deals" ? (
                <motion.span
                  className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent"
                  animate={{ backgroundPosition: ["0% center", "100% center", "0% center"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: "200% auto" }}
                >
                  close deals
                </motion.span>
              ) : (
                <span>{line}</span>
              )}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtext */}
        <motion.p
          className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed mb-12"
          initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.55, ease: "easeOut" }}
        >
          Create professional quotes in 5 minutes, share a link on WhatsApp, and get notified the moment your client opens it.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button as="a" href="/register" size="lg" className="shadow-xl dark:shadow-slate-900/50 shadow-indigo-300/50 hover:shadow-2xl hover:shadow-indigo-300/60" aria-label="Start free trial, no credit card required">
              Start Free — No Credit Card
              <motion.svg
                className="w-4 h-4"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </motion.svg>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      >
        <div className="w-6 h-10 rounded-full border-2 border-slate-300 flex justify-center pt-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-slate-400"
            animate={{ y: [0, 14, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  )
}
