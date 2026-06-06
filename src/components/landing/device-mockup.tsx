"use client";

import { m } from "@/components/shared/motion-client";

export function DeviceMockup() {
  return (
    <m.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, type: "spring" as const, bounce: 0.12 }}
      className="relative w-full mt-16 lg:mt-20"
    >
      <div className="relative max-w-4xl mx-auto px-2 sm:px-4">
        <div className="relative rounded-2xl overflow-hidden bg-[#1A1A1A] shadow-2xl shadow-black/40 border border-white/[0.06]">
          {/* Chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 bg-white/[0.03]">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
            </div>
            <div className="ml-4 flex-1 max-w-md mx-auto">
              <div className="h-7 rounded-lg bg-white/[0.05] flex items-center justify-center px-3">
                <span className="text-xs text-white/30">sendquote.in/q/abc123</span>
              </div>
            </div>
          </div>
          {/* Quote */}
          <div className="p-4 sm:p-6">
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-black text-[8px] font-bold">
                    <svg width="14" height="14" viewBox="0 0 32 32" fill="none"><path d="M10 12h12M10 16h8M10 20h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M22 16l5 5-5 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span className="text-sm font-semibold text-white">Design Studio</span>
                </div>
                <span className="text-xs text-white/30 font-mono">QTE-2026</span>
              </div>
              {[
                { name: "Brand Identity Design", price: "$4,500" },
                { name: "Website UI — 8 Pages", price: "$8,000" },
                { name: "SEO Optimization", price: "$2,500" },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-white/60">{item.name}</span>
                  <span className="text-sm font-medium text-white">{item.price}</span>
                </div>
              ))}
              <div className="flex justify-between items-center border-t border-white/[0.06] pt-3">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-base font-bold text-[#00D4AA]">$15,000</span>
              </div>
              <div className="flex gap-2 pt-1">
                <div className="flex-1 h-9 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#06D6A0] text-black flex items-center justify-center text-xs font-semibold">Accept & Pay</div>
                <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center">
                  <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phone */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="hidden sm:block absolute -bottom-6 -right-2 lg:right-4 w-36 lg:w-40"
        >
          <div className="relative rounded-[2rem] bg-[#1A1A1A] p-2 shadow-2xl shadow-black/40 border border-white/[0.06]">
            <div className="rounded-[1.6rem] overflow-hidden bg-black">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-[9px] font-semibold text-white">9:41</span>
                <div className="flex gap-1">
                  <div className="h-2 w-4 rounded-sm bg-white/30 relative"><div className="absolute right-0.5 top-0.5 h-1 w-2 rounded-sm bg-white/20" /></div>
                </div>
              </div>
              <div className="px-3 pb-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-white text-black text-[4px] font-bold">
                    <svg width="8" height="8" viewBox="0 0 32 32" fill="none"><path d="M10 12h12M10 16h8" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>
                  </div>
                  <span className="text-[7px] font-bold text-white">Design Studio</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[8px]"><span className="text-white/50">Brand</span><span className="font-medium text-white">$4.5k</span></div>
                  <div className="flex justify-between text-[8px]"><span className="text-white/50">Website</span><span className="font-medium text-white">$8k</span></div>
                </div>
                <div className="h-7 rounded-lg bg-gradient-to-r from-[#00D4AA] to-[#06D6A0] text-black flex items-center justify-center text-[8px] font-semibold">Accept & Pay</div>
              </div>
            </div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-black" />
          </div>
        </m.div>
      </div>

      {/* Floating badges */}
      <m.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="hidden sm:flex absolute -top-3 -left-2 w-12 h-12 rounded-2xl border border-white/[0.06] bg-black/80 backdrop-blur-sm items-center justify-center"
      >
        <svg className="h-5 w-5 text-[#00D4AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </m.div>
      <m.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="hidden sm:flex absolute -bottom-1 -left-6 w-10 h-10 rounded-xl border border-white/[0.06] bg-black/80 backdrop-blur-sm items-center justify-center"
      >
        <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
      </m.div>
    </m.div>
  );
}
