"use client";

import { m } from "@/components/shared/motion-client";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Clock, Zap } from "lucide-react";

const stats = [
  { icon: Clock, label: "Avg. time to first quote", value: "< 60s" },
  { icon: TrendingUp, label: "Quote-to-close reduction", value: "75%" },
  { icon: Zap, label: "Win rate improvement", value: "+35%" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-24 pb-20 sm:pt-28 sm:pb-24 lg:pt-32 lg:pb-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-300px] right-[-200px] h-[800px] w-[800px] rounded-full bg-[#00D4AA]/4 blur-[200px]" />
        <div className="absolute bottom-[-300px] left-[-200px] h-[700px] w-[700px] rounded-full bg-[#7C3AED]/4 blur-[180px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-white/[0.01] blur-[150px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl mx-auto text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#00D4AA]/20 bg-[#00D4AA]/5 px-4 py-1.5 text-xs font-medium text-[#00D4AA] mb-8">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Deal Closing Platform
            </span>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
              <span className="text-white">Close Deals </span>
              <span className="bg-gradient-to-r from-[#00D4AA] via-[#06D6A0] to-[#7C3AED] bg-clip-text text-transparent">
                Instantly
              </span>
              <br />
              <span className="text-white/30">Not in Weeks</span>
            </h1>
          </m.div>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 text-lg text-gray-400 max-w-xl mx-auto leading-relaxed"
          >
            AI generates complete GST-ready quotes in 60 seconds. Clients e-sign in one click.
            <br />
            <span className="text-gray-300 font-medium">From conversation to contract — in hours, not days.</span>
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/signup"
              className="group inline-flex h-12 items-center justify-center rounded-xl bg-[#00D4AA] px-7 text-sm font-semibold text-black hover:bg-[#00D4AA]/90 hover:shadow-lg hover:shadow-[#00D4AA]/20 transition-all duration-300"
            >
              Start Closing Deals Faster
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-7 text-sm font-medium text-white/60 hover:bg-white/[0.06] hover:text-white transition-all"
            >
              See Pricing
            </Link>
          </m.div>
        </div>

        {/* Stats */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-20 grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-2xl mx-auto"
        >
          {stats.map((stat, i) => (
            <m.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.12 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center hover:bg-white/[0.04] hover:border-[#00D4AA]/10 transition-colors duration-300"
            >
              <stat.icon className="mx-auto h-5 w-5 text-[#00D4AA] mb-2" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="mt-0.5 text-xs text-gray-400">{stat.label}</div>
            </m.div>
          ))}
        </m.div>

        {/* Floating animated elements */}
        <div className="absolute top-1/4 left-8 w-3 h-3 rounded-full bg-[#00D4AA]/40 motion-safe:animate-pulse" style={{ animationDuration: "3s" }} />
        <div className="absolute top-3/4 right-12 w-2 h-2 rounded-full bg-[#7C3AED]/30 motion-safe:animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-1/4 left-1/4 w-4 h-4 border border-white/5 rounded-lg rotate-45 motion-safe:animate-pulse" style={{ animationDuration: "5s" }} />
      </div>
    </section>
  );
}
