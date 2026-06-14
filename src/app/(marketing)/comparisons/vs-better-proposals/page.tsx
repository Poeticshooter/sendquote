import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
// import { m } from "@/components/shared/motion-client";
import {
  ArrowRight,
  Check,
  X,
  Zap,
  IndianRupee,
  Wallet,
  Infinity,
  Smartphone,
  Users,
  Sparkles,
  DollarSign,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SendQuote vs Better Proposals",
  description:
    "Compare SendQuote vs Better Proposals. See why SendQuote wins on AI drafting, India pricing, GST, Razorpay, and free tier.",
  openGraph: { title: "SendQuote vs Better Proposals: Which Is Better?" },
};

const features = [
  { name: "AI Quote Drafting", ours: true, theirs: false, note: "Better Proposals has no AI" },
  { name: "India Pricing (INR)", ours: true, theirs: false },
  { name: "GST Support", ours: true, theirs: false },
  { name: "Razorpay Integration", ours: true, theirs: false },
  { name: "Deal Rooms (Negotiation)", ours: true, theirs: false, note: "Better Proposals lacks deal rooms" },
  { name: "E-signature", ours: true, theirs: true },
  { name: "Free Tier", ours: true, theirs: false, note: "Better Proposals has a 14-day trial only" },
  { name: "Mobile App", ours: true, theirs: false },
  { name: "CRM Integrations", ours: true, theirs: true },
  { name: "Multi-currency", ours: true, theirs: true },
];

const pricingData = {
  ours: [
    { plan: "Starter (Free)", price: "$0", features: "50 quotes/month, e-sign, basic templates" },
    { plan: "Pro", price: "$19/mo", features: "Unlimited quotes, AI drafting, workflows" },
    { plan: "Business", price: "$49/mo", features: "Deal rooms, team, custom branding" },
  ],
  theirs: [
    { plan: "Solo", price: "$29/mo", features: "5 proposals/month, 1 user, basic templates" },
    { plan: "Pro", price: "$49/mo", features: "50 proposals/month, 5 users, CRM" },
    { plan: "Enterprise", price: "Custom", features: "Unlimited, API, white label" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is SendQuote better than Better Proposals?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, especially for Indian businesses. SendQuote offers AI-powered quote drafting, GST support, Razorpay payments, and a free tier. Better Proposals is simpler but lacks AI, Indian localisation, and has no free plan.",
      },
    },
    {
      "@type": "Question",
      name: "Does Better Proposals have AI drafting?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Better Proposals relies on manual template creation. SendQuote uses AI to generate complete quotes from a brief description in under 60 seconds.",
      },
    },
    {
      "@type": "Question",
      name: "Does Better Proposals support Indian payments?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Better Proposals does not support Razorpay or other Indian payment gateways. SendQuote has native Razorpay integration for UPI, cards, and net banking.",
      },
    },
  ],
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "SendQuote",
  description: "AI-powered quoting and revenue workflow platform for Indian businesses.",
  brand: { "@type": "Brand", name: "SendQuote" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "INR",
    lowPrice: "0",
    highPrice: "1999",
    offerCount: "3",
  },
};

function FeatureRow({ name, ours, theirs, note }: { name: string; ours: boolean; theirs: boolean; note?: string }) {
  return (
    <tr className="border-b border-border">
      <td className="py-3 pr-4 text-sm text-foreground font-medium">{name}</td>
      <td className="py-3 px-4 text-center">
        {ours ? <Check className="w-5 h-5 text-primary inline-block" /> : <X className="w-5 h-5 text-destructive/80 inline-block" />}
      </td>
      <td className="py-3 px-4 text-center">
        {theirs ? <Check className="w-5 h-5 text-muted-foreground inline-block" /> : <X className="w-5 h-5 text-destructive/80 inline-block" />}
      </td>
      {note && <td className="py-3 pl-4 text-xs text-muted-foreground hidden lg:table-cell">{note}</td>}
    </tr>
  );
}

function PricingCard({ plan, price, features }: { plan: string; price: string; features: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{plan}</h4>
      <p className="mt-2 text-3xl font-bold text-foreground">{price}</p>
      <p className="mt-1 text-sm text-muted-foreground">{features}</p>
    </div>
  );
}

export default function VsBetterProposalsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Navbar />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="px-4 pt-28 pb-12 text-center max-w-4xl mx-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
              Comparison
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              SendQuote vs Better Proposals
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Better Proposals makes it easy to send clean proposals fast. But
              can it match AI-powered quoting, GST support, and a free plan?
            </p>
          </div>
        </section>

        {/* Quick verdict */}
        <section className="px-4 pb-12 max-w-4xl mx-auto">
          <m.div
            className="bg-card border border-border rounded-xl p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Quick Verdict</h2>
            </div>
            <p className="text-muted-foreground">
              <strong className="text-foreground">SendQuote is the clear winner for Indian businesses.</strong>{" "}
              Better Proposals offers a straightforward proposal experience, but
              it lacks AI-powered quote generation, has no free plan (14-day
              trial only), and does not support GST or Razorpay. SendQuote
              delivers AI quoting, native Indian payments, GST compliance, deal
              rooms, and a free tier — all at a more affordable price point.
            </p>
          </div>
        </section>

        {/* Feature comparison table */}
        <section className="px-4 pb-12 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4 text-sm font-semibold text-muted-foreground">Feature</th>
                  <th className="pb-3 px-4 text-center text-sm font-semibold text-primary">SendQuote</th>
                  <th className="pb-3 px-4 text-center text-sm font-semibold text-muted-foreground">Better Proposals</th>
                  <th className="pb-3 pl-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f) => (
                  <FeatureRow key={f.name} {...f} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing comparison */}
        <section className="px-4 pb-12 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Pricing Comparison</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> SendQuote
              </h3>
              <div className="space-y-3">
                {pricingData.ours.map((p) => (
                  <PricingCard key={p.plan} {...p} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <X className="w-5 h-5" /> Better Proposals
              </h3>
              <div className="space-y-3">
                {pricingData.theirs.map((p) => (
                  <PricingCard key={p.plan} {...p} />
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Pricing as of June 2026. Better Proposals prices are billed annually.
          </p>
        </section>

        {/* Why SendQuote wins */}
        <section className="px-4 pb-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Why SendQuote Wins for Indian SMBs
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Sparkles, title: "AI-Powered Drafting", desc: "Better Proposals has no AI. SendQuote generates complete quotes from a brief description in seconds." },
              { icon: IndianRupee, title: "INR Pricing & GST", desc: "Built-in GST rates, INR pricing, and tax-compliant invoices. Better Proposals lacks Indian tax support." },
              { icon: Wallet, title: "Razorpay Native", desc: "Accept UPI, cards, and net banking inside the quote. Better Proposals doesn't support Razorpay." },
              { icon: Infinity, title: "Free Tier", desc: "Start free with 50 quotes/month. Better Proposals only offers a 14-day trial." },
              { icon: Smartphone, title: "Mobile App", desc: "Send and manage quotes from your phone. Better Proposals has no mobile app." },
              { icon: Users, title: "Deal Rooms", desc: "Clients can negotiate and counter-offer inside the quote. Better Proposals lacks deal rooms entirely." },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <m.div
                  key={item.title}
                  className="bg-card border border-border rounded-xl p-5"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + idx * 0.05 }}
                >
                  <Icon className="w-5 h-5 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 pb-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {[
              { q: "Is SendQuote better than Better Proposals?", a: "Yes, especially for Indian businesses. SendQuote offers AI-powered quote drafting, GST support, Razorpay payments, and a free tier. Better Proposals is simpler but lacks AI, Indian localisation, and has no free plan." },
              { q: "Does Better Proposals have AI drafting?", a: "No. Better Proposals relies on manual template creation. SendQuote uses AI to generate complete quotes from a brief description in under 60 seconds." },
              { q: "Does Better Proposals support Indian payments?", a: "No. Better Proposals does not support Razorpay or other Indian payment gateways. SendQuote has native Razorpay integration." },
              { q: "Is there a free alternative to Better Proposals?", a: "Yes. SendQuote offers a free Starter plan with 50 quotes/month, e-signature, and basic templates — no credit card required." },
            ].map((faq) => (
              <details key={faq.q} className="group bg-card border border-border rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer text-foreground font-medium text-sm list-none transition-colors duration-200 hover:text-primary">
                  {faq.q}
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform duration-200 flex-shrink-0" />
                </summary>
                <div className="px-4 pb-4 text-sm text-muted-foreground">{faq.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-24 text-center">
          <div className="max-w-xl mx-auto bg-card border border-border rounded-xl p-8">
            <h2 className="text-2xl font-bold text-foreground">
              Ready to try SendQuote?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Start for free. No credit card required.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/comparisons"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
              >
                View all comparisons
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
