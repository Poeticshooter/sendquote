"use client";

import { m } from "@/components/shared/motion-client";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Starter", price: "19", description: "For freelancers and solopreneurs.",
    features: ["50 quotes/month", "Basic templates", "Native e-signature", "Buyer tracking", "PDF export", "Email support"],
    href: "/signup", featured: false,
  },
  {
    name: "Growth", price: "79", description: "For small sales teams.",
    features: ["Unlimited quotes", "AI quote generation", "CRM sync", "Approval workflows", "Smart follow-ups", "In-quote chat & negotiation", "Payment collection", "Priority support"],
    href: "/signup", featured: true,
  },
  {
    name: "Pro", price: "199", description: "For scaling teams.",
    features: ["Everything in Growth", "Deal Room with portal", "Win/loss analytics", "Contract automation", "Custom branding", "API access", "Multi-team governance", "Dedicated support"],
    href: "/signup", featured: false,
  },
];

export function PricingTable() {
  return (
    <section className="border-t border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8" id="pricing">
      <div className="mx-auto max-w-7xl">
        <m.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">Simple, Transparent Pricing</h2>
          <p className="mt-4 text-lg text-white/40">Start free. Upgrade as you grow. No hidden fees.</p>
        </m.div>

        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {tiers.map((tier, i) => (
            <m.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative rounded-2xl border p-8 transition-all duration-500",
                tier.featured
                  ? "border-[#00D4AA]/30 bg-gradient-to-b from-[#00D4AA]/5 to-transparent"
                  : "border-white/[0.06] bg-white/[0.02]"
              )}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#00D4AA] to-[#06D6A0] px-4 py-1 text-xs font-semibold text-black shadow-lg">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
              <p className="mt-1 text-sm text-white/40">{tier.description}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-white">${tier.price}</span>
                <span className="ml-1 text-sm text-white/40">/user/month</span>
              </div>
              <ul className="mt-8 space-y-3">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4AA]" />
                    <span className="text-sm text-white/60">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className={cn(
                  "mt-8 flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all",
                  tier.featured
                    ? "bg-[#00D4AA] text-black hover:bg-[#00D4AA]/90"
                    : "border border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                Get Started
              </Link>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
