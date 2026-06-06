"use client";

import { m } from "@/components/shared/motion-client";
import { Sparkles, Send, Eye, CreditCard } from "lucide-react";

const steps = [
  { icon: Sparkles, title: "AI Generates Your Quote", description: "Describe what you're quoting — AI creates line items, pricing, and terms in 60 seconds." },
  { icon: Send, title: "Send to Your Client", description: "Share a branded interactive link — not a PDF. Track every view and click in real time." },
  { icon: Eye, title: "Client Reviews & Chats", description: "Your client explores the deal room, asks questions via chat, and negotiates on the spot." },
  { icon: CreditCard, title: "Sign & Pay Instantly", description: "One-click e-signature, instant payment via Razorpay or Stripe. Deal closed in minutes." },
];

export function HowItWorks() {
  return (
    <section className="border-t px-4 py-24 sm:px-6 lg:px-8 bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">From conversation to contract in four simple steps.</p>
        </m.div>

        <div className="relative">
          <div className="hidden lg:block absolute left-1/2 top-20 bottom-20 w-px bg-foreground/10" />

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
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background shadow-lg mb-4">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-md">{step.description}</p>
                </div>
                <div className="flex-1 flex justify-center">
                  <m.div
                    whileHover={{ scale: 1.02 }}
                    className="relative w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm"
                  >
                    {i === 0 && (
                      <div className="space-y-3">
                        <div className="h-2 w-24 rounded-full bg-muted-foreground/20" />
                        <div className="space-y-2">
                          {["Website redesign", "SEO optimization", "Content creation"].map((item) => (
                            <div key={item} className="flex items-center gap-2 text-sm">
                              <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="h-8 rounded-lg bg-secondary flex items-center px-3 text-xs text-foreground font-medium">
                          ✨ AI generated in 12 seconds
                        </div>
                      </div>
                    )}
                    {i === 1 && (
                      <div className="space-y-3 text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                          <svg className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                        </div>
                        <p className="text-sm font-medium">Quote link sent!</p>
                        <p className="text-xs text-muted-foreground">Client will be notified via email & WhatsApp</p>
                      </div>
                    )}
                    {i === 2 && (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">A</div>
                          <div className="flex-1 rounded-lg bg-secondary p-2.5 text-xs">
                            <p className="font-medium mb-1">Acme Corp</p>
                            <p className="text-muted-foreground">Can we adjust the timeline to 4 weeks?</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 justify-end">
                          <div className="flex-1 rounded-lg bg-foreground p-2.5 text-xs text-background max-w-[80%]">
                            <p>Absolutely! I've updated the terms.</p>
                          </div>
                          <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center text-[9px] font-bold text-background">Y</div>
                        </div>
                      </div>
                    )}
                    {i === 3 && (
                      <div className="space-y-3 text-center">
                        <div className="flex justify-center gap-4">
                          <div className="h-16 w-24 rounded-xl border-2 border-foreground/20 bg-secondary/50 flex flex-col items-center justify-center">
                            <svg className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-[10px] font-medium text-foreground mt-0.5">Signed</span>
                          </div>
                          <div className="h-16 w-24 rounded-xl border-2 border-foreground/20 bg-secondary/50 flex flex-col items-center justify-center">
                            <svg className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-[10px] font-medium text-foreground mt-0.5">Paid</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Deal closed in 47 minutes</p>
                      </div>
                    )}
                  </m.div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
