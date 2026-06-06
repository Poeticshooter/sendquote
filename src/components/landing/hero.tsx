"use client";

import { m } from "@/components/shared/motion-client";
import Link from "next/link";
import { ArrowRight, TrendingUp, Clock, Zap } from "lucide-react";
import { DeviceMockup } from "./device-mockup";

const stats = [
  { icon: Clock, label: "Avg. time to first quote", value: "< 60s" },
  { icon: TrendingUp, label: "Quote-to-close reduction", value: "75%" },
  { icon: Zap, label: "Win rate improvement", value: "+35%" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-200px] right-[-100px] h-[600px] w-[600px] rounded-full bg-[#00D4AA]/5 blur-[150px]" />
        <div className="absolute bottom-[-200px] left-[-100px] h-[500px] w-[500px] rounded-full bg-[#7C3AED]/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl mx-auto text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#00D4AA]/20 bg-[#00D4AA]/5 px-4 py-1.5 text-xs font-medium text-[#00D4AA] mb-6">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#00D4AA]" />
              AI-Powered Deal Closing Platform
            </span>
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
          >
            Close Deals{" "}
            <span className="bg-gradient-to-r from-[#00D4AA] via-[#06D6A0] to-[#7C3AED] bg-clip-text text-transparent">Instantly</span>
            <br />
            <span className="text-white/50">Not in Weeks.</span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-5 text-base sm:text-lg text-white/40 max-w-xl mx-auto leading-relaxed"
          >
            AI generates quotes in 60 seconds. Buyers sign and pay in one click.
            <br />
            <span className="text-white/60 font-medium">From conversation to contract — in hours, not days.</span>
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/signup"
              className="group inline-flex h-11 items-center justify-center rounded-xl bg-[#00D4AA] px-6 text-sm font-semibold text-black hover:bg-[#00D4AA]/90 transition-all hover:shadow-lg hover:shadow-[#00D4AA]/25"
            >
              Start Closing Deals Faster
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              See Pricing
            </Link>
          </m.div>
        </div>

        <DeviceMockup />

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-20 grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-2xl mx-auto"
        >
          {stats.map((stat, i) => (
            <m.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 + i * 0.15 }}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 text-center hover:bg-white/[0.06] transition-all"
            >
              <stat.icon className="mx-auto h-5 w-5 text-[#00D4AA] mb-2" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="mt-0.5 text-xs text-white/40">{stat.label}</div>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
