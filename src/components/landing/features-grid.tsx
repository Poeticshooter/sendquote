"use client";

import { m } from "@/components/shared/motion-client";
import { Zap, BarChart3, MessageSquare, Shield, Bot, FileText, Users, Clock } from "lucide-react";

const features = [
  { icon: Bot, title: "AI Quote Generation", description: "Complete quotes from a brief description in 60 seconds. AI suggests pricing, upsells, and terms." },
  { icon: BarChart3, title: "Buyer Intent Tracking", description: "Know who opened your quote, what they viewed, and how long they spent on each section." },
  { icon: MessageSquare, title: "In-Quote Negotiation", description: "Buyers can request changes and counter-offer directly inside the quote." },
  { icon: FileText, title: "Interactive Deal Room", description: "Every quote is a branded micro-site — not a static PDF. Add video, testimonials, and more." },
  { icon: Shield, title: "E-Signature", description: "Native signature collection with no redirects. Sign and close in seconds." },
  { icon: Zap, title: "Automated Follow-Ups", description: "AI-drafted follow-ups triggered by buyer behavior. Never lose a deal." },
  { icon: Users, title: "Team Approvals & CRM", description: "Rule-based approvals and bi-directional sync with HubSpot and Pipedrive." },
  { icon: Clock, title: "GST-Ready Invoices", description: "Auto-generate GST-compliant invoices on acceptance. Built for Indian businesses." },
];

export function FeaturesGrid() {
  return (
    <section className="border-t border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <m.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">Everything You Need to Close Deals</h2>
          <p className="mt-4 text-lg text-gray-400">Not just a quote builder — a complete deal-closing workflow for Indian businesses.</p>
        </m.div>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <m.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-[#00D4AA]/20 transition-colors duration-300"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-[#00D4AA] group-hover:bg-[#00D4AA] group-hover:text-black transition-all duration-500">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{feature.description}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
