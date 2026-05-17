"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { FadeIn } from "./animations"
import { features, testimonials, plans, faqs } from "./data"

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-40px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg dark:hover:shadow-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-default group"
    >
      <motion.div
        className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}
        whileHover={{ scale: 1.1, rotate: 3 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {feature.icon}
      </motion.div>
      <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">{feature.title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
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
      <details className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
        <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none text-sm font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          {faq.q}
          <span className="shrink-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 group-open:bg-indigo-600 group-open:text-white transition-all">
            <svg className="w-4 h-4 transition-transform group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </span>
        </summary>
        <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-3">
          {faq.a}
        </div>
      </details>
    </motion.div>
  )
}

export function FeaturesSection() {
  return (
    <section className="py-32 px-6 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm tracking-wide uppercase mb-4 text-center">Everything You Need</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white text-center mb-20">
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
  )
}

export function TestimonialsSection() {
  return (
    <section className="py-32 px-6 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm tracking-wide uppercase mb-4 text-center">What Our Users Say</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white text-center mb-20">
            Trusted by businesses across India
          </h2>
        </FadeIn>

        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-7 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-5">
                  <motion.div
                    className={`w-11 h-11 rounded-full ${t.avatarBg} dark:bg-opacity-50 flex items-center justify-center ${t.avatarText} dark:text-opacity-80 text-sm font-bold shrink-0`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {t.avatar}
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.business}</p>
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

                <blockquote className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FAQSection() {
  return (
    <section className="py-32 px-6 bg-white dark:bg-slate-900">
      <div className="max-w-3xl mx-auto">
        <FadeIn>
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm tracking-wide uppercase mb-4 text-center">FAQ</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white text-center mb-16">
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
  )
}

export function PricingSection() {
  return (
    <section id="pricing" className="py-32 px-6 bg-white dark:bg-slate-900">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm tracking-wide uppercase mb-4 text-center">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white text-center mb-4">
            Start free. Upgrade when you mean business.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-center mb-16">7-day free trial. No credit card required.</p>
        </FadeIn>

        <div className="grid sm:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className={`relative rounded-3xl p-8 border-2 transition-all ${
                  plan.popular
                    ? "bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-slate-700 shadow-2xl shadow-slate-900/30 dark:shadow-slate-900/50"
                    : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-xl"
                }`}
              >
                {plan.popular && (
                  <motion.div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 dark:bg-indigo-600 text-white text-[11px] font-bold px-5 py-1.5 rounded-full whitespace-nowrap"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    MOST POPULAR
                  </motion.div>
                )}

                <h3 className={`text-lg font-bold mb-1 ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-5 ${plan.popular ? "text-slate-400 dark:text-slate-500" : "text-slate-500 dark:text-slate-400"}`}>{plan.desc}</p>

                <div className="mb-8">
                  <span className={`text-5xl font-black ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
                    {plan.price === "0" ? "Free" : `₹${plan.price}`}
                  </span>
                  {plan.price !== "0" && (
                    <span className={`text-sm ml-1 ${plan.popular ? "text-slate-400 dark:text-slate-500" : "text-slate-400 dark:text-slate-500"}`}>/month</span>
                  )}
                </div>

                <ul className={`space-y-3 mb-8 ${plan.popular ? "text-slate-300 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <svg className={`w-5 h-5 shrink-0 ${plan.popular ? "text-indigo-400 dark:text-indigo-300" : "text-indigo-600 dark:text-indigo-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <a href={plan.href} className={`block w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                    plan.popular
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}>
                    {plan.cta}
                  </a>
                </motion.div>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3}>
          <div className="mt-12 text-center">
            <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-6 py-3 rounded-full border border-slate-200 dark:border-slate-700">
              <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h8.25a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              7-day money-back guarantee. If SendQuote doesn&apos;t help you close more deals, we&apos;ll refund every rupee.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

export function CTASection() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950" />
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
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
            <a href="/register" className="inline-flex items-center gap-2 bg-white text-slate-900 font-medium px-8 py-3 rounded-lg shadow-2xl shadow-white/10 hover:bg-slate-100 transition-colors">
              Create Your Free Account
              <motion.svg
                className="w-5 h-5"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </motion.svg>
            </a>
          </motion.div>
        </FadeIn>
      </div>
    </section>
  )
}

export function Footer() {
  return (
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
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>&copy; {new Date().getFullYear()} SendQuote. Built in India.</p>
          <p>Made with care in India</p>
        </div>
      </div>
    </footer>
  )
}
