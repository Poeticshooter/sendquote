"use client";

import { m } from "@/components/shared/motion-client";
import { Zap, BarChart3, MessageSquare, Shield, CreditCard, Bot, FileText, Users } from "lucide-react";

const features = [
  { icon: Bot, title: "AI Quote Generation", description: "Complete quotes from a brief description in under 60 seconds. AI suggests pricing, upsells, and terms." },
  { icon: BarChart3, title: "Buyer Intent Analytics", description: "Know exactly who opened your quote, what they viewed, and how long they spent on each section." },
  { icon: MessageSquare, title: "In-Quote Negotiation", description: "Buyers can request changes and counter-offer directly inside the quote. No more email ping-pong." },
  { icon: FileText, title: "Interactive Deal Room", description: "Every quote is a branded, responsive micro-site — not a static PDF. Add video, testimonials, and calculators." },
  { icon: Shield, title: "One-Click E-Signature", description: "Native signature collection with no redirects. Sign and close in seconds, not days." },
  { icon: CreditCard, title: "Instant Payment Collection", description: "Accept credit cards, UPI, and bank transfers — right inside the quote via Razorpay or Stripe." },
  { icon: Zap, title: "Automated Follow-Ups", description: "AI-drafted personalized follow-ups triggered by buyer behavior. Never lose a deal to silence." },
  { icon: Users, title: "Team Approvals & CRM Sync", description: "Rule-based approval workflows and bi-directional sync with HubSpot, Salesforce, and Pipedrive." },
];

export function FeaturesGrid() {
  return (
    <section className="border-t px-4 py-24 sm:px-6 lg:px-8" id="features">
      <div className="mx-auto max-w-7xl">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything You Need to Close Deals</h2>
          <p className="mt-4 text-lg text-muted-foreground">Not just a quote builder — an entire deal-closing workflow in one platform.</p>
        </m.div>

        <m.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ staggerChildren: 0.08 }}
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature, i) => (
            <m.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, type: "spring" as const, bounce: 0.2 }}
              className="group rounded-xl border bg-card p-6 hover:shadow-lg hover:border-foreground/20 transition-all duration-300"
              whileHover={{ y: -4 }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
