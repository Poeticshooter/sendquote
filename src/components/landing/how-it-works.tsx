"use client";

import { m } from "@/components/shared/motion-client";
import { Sparkles, Send, Eye, FileSignature } from "lucide-react";

const steps = [
  { icon: Sparkles, title: "AI Generates Your Quote", description: "Describe what you're quoting — AI creates line items, pricing, and terms in 60 seconds." },
  { icon: Send, title: "Send to Your Client", description: "Share a branded interactive link — not a PDF. Track every view and click in real time." },
  { icon: Eye, title: "Client Reviews & Chats", description: "Your client explores the deal room, asks questions via chat, and negotiates on the spot." },
  { icon: FileSignature, title: "Sign & Accept", description: "One-click e-signature. No printing, no scanning. Deal closed in minutes. GST invoice auto-generated." },
];

export function HowItWorks() {
  return (
    <section className="border-t border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <m.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">How It Works</h2>
          <p className="mt-4 text-lg text-white/40">From conversation to contract in four simple steps.</p>
        </m.div>

        <div className="grid gap-12 lg:gap-16">
          {steps.map((step, i) => (
            <m.div
              key={step.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring" as const, bounce: 0.2, duration: 0.7, delay: i * 0.1 }}
              className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-8 lg:gap-16`}
            >
              <div className="flex-1">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00D4AA] to-[#06D6A0] text-black shadow-lg mb-4">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-white/40 leading-relaxed max-w-md">{step.description}</p>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  {i === 0 && (
                    <div className="space-y-3">
                      <div className="h-2 w-24 rounded-full bg-white/10" />
                      <div className="space-y-2">
                        {["Website redesign", "SEO optimization", "Content creation"].map((item) => (
                          <div key={item} className="flex items-center gap-2 text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#00D4AA]" />
                            <span className="text-white/60">{item}</span>
                          </div>
                        ))}
                      </div>
                      <div className="h-8 rounded-lg bg-[#00D4AA]/10 flex items-center px-3 text-xs text-[#00D4AA] font-medium">✨ AI generated in 12 seconds</div>
                    </div>
                  )}
                  {i === 1 && (
                    <div className="space-y-3 text-center">
                      <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
                        <svg className="h-6 w-6 text-[#00D4AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                      </div>
                      <p className="text-sm font-medium text-white">Quote link sent!</p>
                      <p className="text-xs text-white/40">Client will be notified via email & WhatsApp</p>
                    </div>
                  )}
                  {i === 2 && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">A</div>
                        <div className="flex-1 rounded-lg bg-white/5 p-2.5 text-xs">
                          <p className="font-medium text-white mb-1">Acme Corp</p>
                          <p className="text-white/40">Can we adjust the timeline?</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 justify-end">
                        <div className="flex-1 rounded-lg bg-gradient-to-r from-[#00D4AA] to-[#06D6A0] p-2.5 text-xs text-black max-w-[80%]">
                          <p>Absolutely! I've updated the terms.</p>
                        </div>
                        <div className="h-6 w-6 rounded-full bg-[#00D4AA] flex items-center justify-center text-[9px] font-bold text-black">Y</div>
                      </div>
                    </div>
                  )}
                  {i === 3 && (
                    <div className="space-y-3 text-center">
                      <div className="flex justify-center">
                        <div className="h-20 w-20 rounded-xl border border-[#00D4AA]/20 bg-[#00D4AA]/5 flex flex-col items-center justify-center">
                          <svg className="h-8 w-8 text-[#00D4AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="text-[10px] font-medium text-[#00D4AA] mt-1">Accepted</span>
                        </div>
                      </div>
                      <p className="text-xs text-white/40">GST invoice auto-generated</p>
                    </div>
                  )}
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
