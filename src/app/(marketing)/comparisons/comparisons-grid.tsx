"use client";

import Link from "next/link";
// import { m } from "@/components/shared/motion-client";
import {
  FileText,
  IndianRupee,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Star,
  CheckCircle2,
} from "lucide-react";

const comparisons = [
  {
    slug: "vs-pandadoc",
    name: "PandaDoc",
    icon: FileText,
    tagline: "Mature document automation — but US-centric and expensive",
    whyWins: [
      "Free tier vs $35/mo minimum",
      "Native GST & Razorpay support",
      "AI-powered quoting (not just templates)",
      "INR pricing — no hidden FX fees",
    ],
    score: "9.5",
  },
  {
    slug: "vs-proposify",
    name: "Proposify",
    icon: Sparkles,
    tagline: "Decent proposal tool — but no AI, no India support, no mobile app",
    whyWins: [
      "AI generates your quote in 60 seconds",
      "Free tier vs $49/mo",
      "Deal rooms with live negotiation",
      "Full mobile experience",
    ],
    score: "9.7",
  },
  {
    slug: "vs-qwilr",
    name: "Qwilr",
    icon: MessageSquare,
    tagline: "Beautiful proposals — but no AI drafting, no INR, no free plan",
    whyWins: [
      "AI writing, not just nice templates",
      "Free tier vs $35/mo starting",
      "GST & Razorpay natively",
      "In-quote negotiation & deal rooms",
    ],
    score: "9.3",
  },
  {
    slug: "vs-better-proposals",
    name: "Better Proposals",
    icon: IndianRupee,
    tagline: "Simple proposal tool — but no AI, no deal rooms, limited integrations",
    whyWins: [
      "AI drafting vs manual creation",
      "Free tier vs 14-day trial only",
      "Deal rooms for buyer negotiation",
      "Deeper CRM integrations",
    ],
    score: "9.6",
  },
];

export function ComparisonsGrid() {
  return (
    <section className="px-4 pb-16 max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-6">
        {comparisons.map((cmp, idx) => {
          const Icon = cmp.icon;
          return (
            <div
              key={cmp.slug}}}}
            >
              <Link href={`/comparisons/${cmp.slug}`} className="group block">
                <div className="bg-card border border-border rounded-xl p-6 h-full transition-all duration-200 hover:border-[#00D4AA]/30 hover:shadow-[0_0_20px_rgba(0,212,170,0.08)]">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">SendQuote vs {cmp.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{cmp.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-sm font-bold">{cmp.score}</span>
                    </div>
                  </div>

                  {/* Why SendQuote Wins */}
                  <div className="border-t border-border pt-4 mt-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Why SendQuote Wins
                    </p>
                    <ul className="space-y-1.5">
                      {cmp.whyWins.map((reason) => (
                        <li key={reason} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Read more link */}
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Read full comparison <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
