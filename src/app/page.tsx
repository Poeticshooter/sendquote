"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useInView, useMotionValue } from "framer-motion"
import BrandLogo from "@/components/brand-logo"
import ThemeToggle from "@/components/theme-toggle"

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Professional PDF",
    desc: "Clean, branded PDF with your logo. Generated and downloadable instantly.",
    color: "from-indigo-500 to-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Open Tracking",
    desc: "Get notified the moment your client opens the quote. See timestamp and device.",
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "One-Tap Accept",
    desc: "Client clicks Accept — you get notified instantly. No back-and-forth.",
    color: "from-violet-500 to-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Smart Reminders",
    desc: "Automatic follow-up if the client hasn't responded in 48 hours.",
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
    title: "Mobile-First",
    desc: "Your clients see a beautiful mobile page. No app download needed.",
    color: "from-pink-500 to-pink-600",
    bg: "bg-pink-50",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "GST Ready",
    desc: "Built-in GST calculation (5%, 12%, 18%, 28%). Perfect for Indian businesses.",
    color: "from-cyan-500 to-cyan-600",
    bg: "bg-cyan-50",
  },
]

const steps = [
  {
    num: "01",
    title: "Create a Quote",
    desc: "Fill in client details, add line items, set GST. It takes 5 minutes — not an hour.",
    color: "bg-indigo-600",
    textColor: "text-indigo-600",
    borderColor: "border-indigo-200",
  },
  {
    num: "02",
    title: "Share the Link",
    desc: "Send via WhatsApp, SMS, or email. Your client sees a beautiful page — no app needed.",
    color: "bg-emerald-600",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-200",
  },
  {
    num: "03",
    title: "Track & Close",
    desc: "Get notified when they open it. Client can accept with one tap. Close deals faster.",
    color: "bg-violet-600",
    textColor: "text-violet-600",
    borderColor: "border-violet-200",
  },
]

const testimonials = [
  {
    name: "Rajesh Kumar",
    business: "RK Construction, Delhi",
    avatar: "RK",
    avatarBg: "bg-indigo-100",
    avatarText: "text-indigo-700",
    quote: "I was sending quotes over WhatsApp as screenshots. Clients kept asking for corrections. Now I create a proper quote in 5 minutes, share the link, and they accept online.",
  },
  {
    name: "Priya Sharma",
    business: "Priya Design Studio, Mumbai",
    avatar: "PS",
    avatarBg: "bg-emerald-100",
    avatarText: "text-emerald-700",
    quote: "The GST invoice feature alone saves me 2 hours every month. I used to fill Excel templates. Now everything is automatic and my accountant loves it too.",
  },
  {
    name: "Anil Mehta",
    business: "Mehta Electricals, Ahmedabad",
    avatar: "AM",
    avatarBg: "bg-amber-100",
    avatarText: "text-amber-700",
    quote: "When clients open my quote, I get a notification. I follow up at the right moment. That one feature helped me close several big orders.",
  },
]

const plans = [
  {
    name: "Free",
    price: "0",
    desc: "Try it out.",
    features: ["5 quotes/month", "Basic quote builder", "Shareable link", "PDF download"],
    cta: "Get Started",
    href: "/register",
    popular: false,
  },
  {
    name: "Starter",
    price: "299",
    desc: "For serious businesses.",
    features: [
      "Unlimited quotes",
      "Open tracking",
      "Branded PDF",
      "One-tap accept",
      "WhatsApp sharing",
      "Auto follow-ups",
      "GST invoices",
    ],
    cta: "Start Free Trial",
    href: "/register",
    popular: true,
  },
  {
    name: "Professional",
    price: "799",
    desc: "For high-volume businesses.",
    features: [
      "Everything in Starter",
      "Up to 5 team members",
      "Custom branding",
      "Analytics dashboard",
      "Bulk CSV export",
    ],
    cta: "Start Free Trial",
    href: "/register",
    popular: false,
  },
]

const faqs = [
  { q: "Does my client need to create an account to view the quote?", a: "No. Your client opens the link and sees the full quote on their phone. No sign-up, no app download. They can accept or request changes with one tap." },
  { q: "How do I receive payments after a quote is accepted?", a: "SendQuote handles quote creation and tracking. For payments, share your UPI ID or bank details directly with clients." },
  { q: "Can I create GST-ready invoices?", a: "Yes. Every quote and invoice supports GST calculation (5%, 12%, 18%, 28%). Set your GST number in settings and it appears on all documents." },
  { q: "How do I share quotes with clients on WhatsApp?", a: "Each quote gets a unique link. Click WhatsApp from your quote detail page — it opens WhatsApp with the message pre-filled." },
  { q: "Is my data safe and private?", a: "Yes. Your quotes are private to your account. Only clients with the shared link can view them. We never share your data." },
]

function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-30 ${className}`}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

function Floating3DCube({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{ perspective: "1000px" }}
      animate={{
        rotateY: [0, 360],
        rotateX: [0, -20],
        y: [0, -20, 0],
      }}
      transition={{
        duration: 20,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl shadow-2xl shadow-indigo-500/30"
        style={{ transform: "rotateY(45deg) rotateX(30deg)" }} />
    </motion.div>
  )
}

function FloatingDocument({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{
        y: [0, -25, 0],
        rotate: [-5, 5, -5],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="w-12 h-16 bg-white rounded-lg shadow-xl border border-slate-200 flex flex-col p-2 gap-1">
        <div className="h-1 bg-slate-200 rounded" />
        <div className="h-1 bg-slate-200 rounded w-3/4" />
        <div className="h-1 bg-slate-200 rounded w-1/2" />
        <div className="mt-auto h-2 bg-indigo-500 rounded" />
      </div>
    </motion.div>
  )
}

function FloatingCoin({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{
        y: [0, -15, 0],
        rotateY: [0, 180, 360],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 5,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center">
        <span className="text-amber-900 font-bold text-lg">₹</span>
      </div>
    </motion.div>
  )
}

function FloatingCheck({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{
        y: [0, -20, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="w-12 h-12 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
    </motion.div>
  )
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ScaleIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-40px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SlideIn({ children, direction = "left", delay = 0, className = "" }: { children: React.ReactNode; direction?: "left" | "right"; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-40px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: direction === "left" ? -40 : 40 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function FAQItem({ faq, index }: { faq: { q: string; a: string }; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-20px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
    >
      <details className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-indigo-300 transition-colors">
        <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
          {faq.q}
          <span className="shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-open:bg-indigo-600 group-open:text-white transition-all">
            <svg className="w-4 h-4 transition-transform group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </span>
        </summary>
        <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
          {faq.a}
        </div>
      </details>
    </motion.div>
  )
}

function FeatureCard({ feature, index }: { feature: typeof features[0] & { textColor?: string }; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-40px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all cursor-default"
    >
      <motion.div
        className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 ${feature.textColor}`}
        whileHover={{ scale: 1.1, rotate: 3 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {feature.icon}
      </motion.div>
      <h3 className="font-bold text-slate-900 text-base mb-1.5">{feature.title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
    </motion.div>
  )
}

export default function LandingPage() {
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
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" aria-label="Sign in to your account" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all">
              Sign In
            </Link>
            <Link href="/register" aria-label="Create a free account" className="text-sm font-medium bg-slate-900 text-white px-5 py-2 rounded-xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white">
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
          className="absolute top-32 right-[8%] w-14 h-14 border-2 border-indigo-200 rounded-2xl rotate-12 opacity-50"
          animate={{ rotate: [12, 20, 12], y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{ x: shape2X, y: shape2Y }}
          className="absolute top-[45%] left-[6%] w-10 h-10 bg-emerald-200 rounded-full opacity-40"
          animate={{ y: [0, -20, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-32 left-[12%] w-14 h-14 border-2 border-emerald-200 rounded-xl -rotate-12 opacity-30"
          animate={{ rotate: [-12, -20, -12], y: [0, 15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-[30%] right-[18%] w-8 h-8 bg-violet-200 rounded-lg rotate-45 opacity-30"
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
            className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-xs font-medium px-4 py-1.5 rounded-full mb-10 border border-slate-200"
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
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] text-slate-900 mb-8"
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
            className="text-lg sm:text-xl text-slate-500 max-w-xl mx-auto leading-relaxed mb-12"
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
              <Link
                href="/register"
                aria-label="Start free trial, no credit card required"
                className="group relative flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold text-base shadow-xl shadow-indigo-300/50 hover:shadow-2xl hover:shadow-indigo-300/60 transition-all overflow-hidden"
              >
                <motion.span
                  className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
                <motion.span
                  className="relative z-10 flex items-center gap-2"
                  initial={{ x: 0 }}
                  whileHover={{ x: 2 }}
                >
                  Start Free — No Credit Card
                  <motion.svg
                    className="w-4 h-4"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </motion.svg>
                </motion.span>
              </Link>
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

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-indigo-600 font-semibold text-sm tracking-wide uppercase mb-4 text-center">How It Works</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 text-center mb-20">
              Three steps to win more business
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.15}>
                <motion.div
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className="group relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-default flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center shadow-sm`}>
                      <span className="text-white font-black text-base">{step.num}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">{step.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden sm:flex absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-px bg-slate-200" />
                  )}
                </motion.div>
              </FadeIn>
            ))}
          </div>

          {/* WhatsApp Feature Banner */}
          <FadeIn delay={0.3}>
            <motion.div
              className="mt-20 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-teal-50 rounded-3xl p-10 sm:p-14 border border-emerald-100 text-center relative overflow-hidden"
              whileInView={{ scale: [0.98, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {/* Decorative orbs */}
              <motion.div
                className="absolute top-4 right-8 w-32 h-32 bg-emerald-200 rounded-full blur-3xl opacity-40"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-4 left-8 w-24 h-24 bg-teal-200 rounded-full blur-2xl opacity-30"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              />

              <div className="relative z-10">
                <motion.div
                  className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm mb-6"
                  whileHover={{ scale: 1.05 }}
                >
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  <span className="text-xs font-medium text-slate-700">Share via WhatsApp</span>
                </motion.div>

                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                  Share quotes directly on WhatsApp
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
                  No need for your client to sign up. Just share the link — they open it, see the quote, and can accept it with one tap.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                  {["Opens in WhatsApp", "No login needed", "One-tap accept"].map((tag) => (
                    <motion.span
                      key={tag}
                      className="inline-flex items-center gap-1.5 text-xs bg-white text-emerald-700 px-4 py-2 rounded-full shadow-sm"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {tag}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-indigo-600 font-semibold text-sm tracking-wide uppercase mb-4 text-center">Everything You Need</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 text-center mb-20">
              No more WhatsApp screenshots
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: 5, suffix: " min", label: "To create a quote" },
              { value: 0, prefix: "₹", label: "Startup cost" },
              { value: 100, suffix: "%", label: "Online — no app needed" },
              { value: 18, suffix: "%", label: "GST support built-in" },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <p className="text-4xl sm:text-5xl font-black text-slate-900 mb-2">
                    {stat.prefix || ""}{stat.value}{stat.suffix || ""}
                  </p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-indigo-600 font-semibold text-sm tracking-wide uppercase mb-4 text-center">What Our Users Say</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 text-center mb-20">
              Trusted by businesses across India
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.12}>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex flex-col h-full"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <motion.div
                      className={`w-11 h-11 rounded-full ${t.avatarBg} flex items-center justify-center ${t.avatarText} text-sm font-bold shrink-0`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      {t.avatar}
                    </motion.div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.business}</p>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <motion.svg
                        key={s}
                        className="w-4 h-4 text-amber-400"
                        fill="currentColor" viewBox="0 0 20 20"
                        whileHover={{ scale: 1.3, rotate: 15 }}
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </motion.svg>
                    ))}
                  </div>

                  <blockquote className="text-sm text-slate-600 leading-relaxed flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <p className="text-indigo-600 font-semibold text-sm tracking-wide uppercase mb-4 text-center">FAQ</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 text-center mb-16">
              Common questions
            </h2>
          </FadeIn>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={faq.q} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Dark CTA */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Animated particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeInOut",
            }}
          />
        ))}

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
              Stop losing jobs to unprofessional quotes.
            </h2>
            <p className="text-lg text-slate-400 mb-12 max-w-lg mx-auto">
              Join Indian contractors and freelancers who close more deals with SendQuote.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-slate-900 px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-white/10 hover:bg-indigo-50 transition-all"
              >
                Create Your Free Account
                <motion.svg
                  className="w-5 h-5"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </motion.svg>
              </Link>
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-indigo-600 font-semibold text-sm tracking-wide uppercase mb-4 text-center">Pricing</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 text-center mb-4">
              Start free. Upgrade when you mean business.
            </h2>
            <p className="text-slate-500 text-center mb-16">7-day free trial. No credit card required.</p>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.12}>
                <ScaleIn>
                  <motion.div
                    whileHover={{ y: -6, transition: { duration: 0.3 } }}
                    className={`relative rounded-3xl p-8 border-2 transition-all ${
                      plan.popular
                        ? "bg-slate-900 border-slate-900 shadow-2xl shadow-slate-900/30"
                        : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xl"
                    }`}
                  >
                    {plan.popular && (
                      <motion.div
                        className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[11px] font-bold px-5 py-1.5 rounded-full whitespace-nowrap"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        MOST POPULAR
                      </motion.div>
                    )}

                    <h3 className={`text-lg font-bold mb-1 ${plan.popular ? "text-white" : "text-slate-900"}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm mb-5 ${plan.popular ? "text-slate-400" : "text-slate-500"}`}>{plan.desc}</p>

                    <div className="mb-8">
                      <span className={`text-5xl font-black ${plan.popular ? "text-white" : "text-slate-900"}`}>
                        {plan.price === "0" ? "Free" : `₹${plan.price}`}
                      </span>
                      {plan.price !== "0" && (
                        <span className={`text-sm ml-1 ${plan.popular ? "text-slate-400" : "text-slate-400"}`}>/month</span>
                      )}
                    </div>

                    <ul className={`space-y-3 mb-8 ${plan.popular ? "text-slate-300" : "text-slate-600"}`}>
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm">
                          <svg className={`w-5 h-5 shrink-0 ${plan.popular ? "text-indigo-400" : "text-indigo-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        href={plan.href}
                        className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                          plan.popular
                            ? "bg-white text-slate-900 hover:bg-indigo-50 shadow-lg"
                            : "bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white"
                        }`}
                      >
                        {plan.cta}
                      </Link>
                    </motion.div>
                  </motion.div>
                </ScaleIn>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3}>
            <div className="mt-12 text-center">
              <p className="inline-flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-6 py-3 rounded-full border border-slate-200">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h8.25a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                7-day money-back guarantee. If SendQuote doesn&apos;t help you close more deals, we&apos;ll refund every rupee.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900 text-slate-400">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#4F46E5" />
                <path d="M10 10h12M10 16h8M10 22h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M22 18l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-white font-semibold text-sm">SendQuote</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-white transition-colors">Get Started</Link>
              <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
              <Link href="/admin/login" className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                Admin Login
              </Link>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p>&copy; {new Date().getFullYear()} SendQuote. Built in India.</p>
            <p>Made with care in India</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
