"use client"

import { motion } from "framer-motion"
import { FadeIn } from "./animations"
import { steps } from "./data"

export default function HowItWorksSection() {
  return (
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
                className="group relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl:shadow-slate-900/50 hover:border-indigo-200:border-indigo-600 transition-all cursor-default flex flex-col h-full"
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
  )
}
