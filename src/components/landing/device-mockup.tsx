"use client";

import { m } from "@/components/shared/motion-client";
import { useEffect, useState } from "react";

export function DeviceMockup() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <m.div
      initial={{ opacity: 0, y: 40 }}
      animate={mounted ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.3, type: "spring" as const, bounce: 0.12 }}
      className="relative w-full mt-16 lg:mt-20"
    >
      <div className="relative max-w-5xl mx-auto">
        {/* Desktop browser mockup */}
        <div className="relative rounded-t-xl overflow-hidden bg-neutral-900 shadow-2xl shadow-black/20 border border-neutral-800 mx-2 sm:mx-4">
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-800/60">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-amber-500/70" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
            </div>
            <div className="ml-4 flex-1 max-w-lg mx-auto">
              <div className="h-7 rounded-md bg-neutral-700/40 flex items-center justify-center px-3 gap-2">
                <svg className="h-3.5 w-3.5 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-xs text-neutral-400 truncate">sendquote.in/q/abc123</span>
              </div>
            </div>
          </div>
          {/* Quote preview */}
          <div className="bg-white dark:bg-neutral-950">
            <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <img src="/logo-icon.svg" alt="" className="h-6 w-6" />
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">Design Studio</span>
                </div>
                <span className="text-xs text-neutral-500 font-mono tracking-tight">QTE-2026-0001</span>
              </div>
              {/* Line items */}
              <div className="space-y-3">
                {[
                  { name: "Brand Identity Design", price: "$4,500" },
                  { name: "Website UI — 8 Pages", price: "$8,000" },
                  { name: "SEO Optimization", price: "$2,500" },
                  { name: "Content Writing", price: "$1,500" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-0.5">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{item.name}</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{item.price}</span>
                  </div>
                ))}
              </div>
              {/* Total */}
              <div className="flex justify-between items-center border-t border-neutral-200 dark:border-neutral-800 pt-3">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">Total</span>
                <span className="text-base font-bold text-neutral-900 dark:text-white">$16,500</span>
              </div>
              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <div className="flex-1 h-9 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-xs font-semibold tracking-wide cursor-default">Accept & Pay</div>
                <div className="h-9 w-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center cursor-default">
                  <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto h-2 w-1/4 rounded-b-lg bg-neutral-800" />

        {/* Phone mockup */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.7, type: "spring" as const, bounce: 0.15 }}
          className="hidden sm:block absolute -bottom-6 -right-2 lg:right-4 w-36 lg:w-44"
        >
          <div className="relative rounded-[2rem] bg-neutral-900 p-2 shadow-2xl shadow-black/30 border border-neutral-700">
            <div className="rounded-[1.6rem] overflow-hidden bg-white dark:bg-neutral-950">
              {/* Status bar */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-[9px] font-semibold text-neutral-900 dark:text-white">9:41</span>
                <div className="flex gap-1">
                  <div className="h-2 w-4 rounded-sm bg-neutral-900 dark:bg-white/80 relative">
                    <div className="absolute right-0.5 top-0.5 h-1 w-2 rounded-sm bg-neutral-400 dark:bg-neutral-500" />
                  </div>
                </div>
              </div>
              <div className="px-3 pb-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <img src="/logo-icon.svg" alt="" className="h-3.5 w-3.5" />
                  <span className="text-[7px] font-bold text-neutral-900 dark:text-white truncate">Design Studio</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[8px]"><span className="text-neutral-500">Brand Identity</span><span className="font-medium text-neutral-800 dark:text-white">$4.5k</span></div>
                  <div className="flex justify-between text-[8px]"><span className="text-neutral-500">Website UI</span><span className="font-medium text-neutral-800 dark:text-white">$8k</span></div>
                </div>
                <div className="h-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-[8px] font-semibold">Accept & Pay</div>
              </div>
            </div>
            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-neutral-900" />
          </div>
        </m.div>
      </div>

      {/* Animated badges */}
      <m.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="hidden sm:flex absolute -top-3 -left-2 lg:-left-4 w-12 h-12 lg:w-14 lg:h-14 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-sm items-center justify-center"
      >
        <svg className="h-5 w-5 lg:h-6 lg:w-6 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </m.div>
      <m.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="hidden sm:flex absolute -bottom-1 -left-6 lg:-left-8 w-9 h-9 lg:w-10 lg:h-10 rounded-xl border border-foreground/10 bg-background/80 backdrop-blur-sm items-center justify-center"
      >
        <svg className="h-4 w-4 lg:h-5 lg:w-5 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
      </m.div>
    </m.div>
  );
}
