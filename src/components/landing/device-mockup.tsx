"use client";

import { m } from "@/components/shared/motion-client";

export function DeviceMockup() {
  return (
    <m.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.4, type: "spring" as const, bounce: 0.15 }}
      className="relative mx-auto max-w-5xl px-4 mt-16"
    >
      <div className="relative mx-auto max-w-4xl">
        <div className="relative rounded-t-xl overflow-hidden bg-neutral-900 shadow-2xl border border-neutral-800">
          <div className="flex items-center gap-1.5 px-4 py-3 bg-neutral-800/80">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            <div className="ml-4 flex-1 max-w-md">
              <div className="h-6 rounded-md bg-neutral-700/50 flex items-center px-3 text-xs text-neutral-400">
                sendquote.in/q/abc123
              </div>
            </div>
          </div>
          <div className="p-1">
            <div className="rounded-lg bg-white dark:bg-neutral-950 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <img src="/logo-icon.svg" alt="" className="h-6 w-6" />
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">Acme Corp</span>
                  </div>
                  <span className="text-xs text-neutral-500 font-mono">QTE-2026-0001</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: "Website Redesign Package", price: "$12,000" },
                    { name: "SEO Optimization", price: "$3,500" },
                    { name: "Content Creation (10 pages)", price: "$4,000" },
                  ].map((item) => (
                    <div key={item.name} className="flex justify-between text-sm">
                      <span className="text-neutral-700 dark:text-neutral-300">{item.name}</span>
                      <span className="text-neutral-900 dark:text-white font-medium">{item.price}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm border-t border-neutral-200 dark:border-neutral-800 pt-2 font-bold">
                    <span className="text-neutral-900 dark:text-white">Total</span>
                    <span className="text-neutral-900 dark:text-white">$19,500</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <div className="flex-1 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-xs font-medium">Accept & Pay</div>
                  <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto h-2 w-1/3 rounded-b-lg bg-neutral-800" />
      </div>

      <m.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8, type: "spring" as const, bounce: 0.2 }}
        className="absolute -bottom-8 -right-4 sm:right-8 w-32 sm:w-40"
      >
        <div className="relative rounded-[1.5rem] bg-neutral-900 p-1.5 shadow-2xl border border-neutral-800">
          <div className="rounded-[1.2rem] bg-white dark:bg-neutral-950 overflow-hidden">
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <img src="/logo-icon.svg" alt="" className="h-4 w-4" />
                <span className="text-[8px] font-bold text-neutral-900 dark:text-white">Acme Corp</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[8px]"><span className="text-neutral-500">Website</span><span className="text-neutral-800 dark:text-white font-medium">$12k</span></div>
                <div className="flex justify-between text-[8px]"><span className="text-neutral-500">SEO</span><span className="text-neutral-800 dark:text-white font-medium">$3.5k</span></div>
              </div>
              <div className="h-6 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-[7px] font-medium">Accept</div>
            </div>
          </div>
        </div>
      </m.div>

      <m.div
        animate={{ y: [0, -8, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-4 -left-4 w-14 h-14 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      >
        <svg className="h-6 w-6 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </m.div>
      <m.div
        animate={{ y: [0, 8, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-2 -left-8 w-10 h-10 rounded-xl border border-foreground/10 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      >
        <svg className="h-5 w-5 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
      </m.div>
    </m.div>
  );
}
