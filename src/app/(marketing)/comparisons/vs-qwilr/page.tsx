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
  Users,
  Sparkles,
  DollarSign,
  Globe,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SendQuote vs Qwilr",
  description:
    "Compare SendQuote vs Qwilr for interactive proposals. See why SendQuote wins on AI drafting, India pricing, GST, Razorpay, and free tier.",
  openGraph: { title: "SendQuote vs Qwilr: Which Proposal Tool Is Better?" },
};

const features = [
  { name: "AI Quote Drafting", ours: true, theirs: false, note: "Qwilr has no AI proposal generation" },
  { name: "India Pricing (INR)", ours: true, theirs: false },
  { name: "GST Support", ours: true, theirs: false },
  { name: "Razorpay Integration", ours: true, theirs: false },
  { name: "Deal Rooms (Negotiation)", ours: true, theirs: false, note: "Qwilr lacks client negotiation features" },
  { name: "E-signature", ours: true, theirs: true },
  { name: "Free Tier", ours: true, theirs: false, note: "Qwilr starts at $35/mo, no free plan" },
  { name: "Mobile App", ours: true, theirs: false, note: "Qwilr is browser-responsive only" },
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
    { plan: "Starter", price: "$35/mo", features: "5 proposals, 1 user, Qwilr branding" },
    { plan: "Business", price: "$79/mo", features: "10 proposals, 5 users, custom branding" },
    { plan: "Enterprise", price: "Custom", features: "Unlimited, SSO, dedicated support" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is SendQuote better than Qwilr?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For Indian businesses and budget-conscious teams, yes. SendQuote offers AI drafting, GST support, Razorpay, deal rooms, and a free tier. Qwilr excels at interactive branded pages but costs more and lacks Indian localisation.",
      },
    },
    {
      "@type": "Question",
      name: "Does Qwilr have AI proposal generation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Qwilr does not offer AI-powered proposal or quote generation. SendQuote uses AI to draft complete quotes from a brief description in under 60 seconds.",
      },
    },
    {
      "@type": "Question",
      name: "Does Qwilr support Indian payments?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Qwilr supports Stripe and PayPal but does not integrate with Razorpay or other Indian payment gateways. SendQuote has native Razorpay support.",
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

export default function VsQwilrPage() {
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
          <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
              Comparison
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              SendQuote vs Qwilr
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Qwilr turns proposals into stunning web pages. But does it have
              AI, GST support, or a price that makes sense for Indian businesses?
            </p>
          </div>
        </section>

        {/* Quick verdict */}
        <section className="px-4 pb-12 max-w-4xl mx-auto">
          <div
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
              <strong className="text-foreground">SendQuote wins for value and localisation.</strong> Qwilr&apos;s
              interactive proposal pages are visually impressive, but the tool
              lacks AI-powered drafting, has no free plan ($35/mo minimum), and
              doesn&apos;t support GST or Razorpay. SendQuote delivers AI quoting,
              native Indian payments, GST compliance, deal rooms, and a free
              tier — at a fraction of the cost.
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
                  <th className="pb-3 px-4 text-center text-sm font-semibold text-muted-foreground">Qwilr</th>
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
                <X className="w-5 h-5" /> Qwilr
              </h3>
              <div className="space-y-3">
                {pricingData.theirs.map((p) => (
                  <PricingCard key={p.plan} {...p} />
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Pricing as of June 2026. Qwilr prices are billed annually.
          </p>
        </section>

        {/* Why SendQuote wins */}
        <section className="px-4 pb-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Why SendQuote Wins for Indian SMBs
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Sparkles, title: "AI-Powered Drafting", desc: "Qwilr has no AI. SendQuote generates complete quotes from a brief description in seconds." },
              { icon: IndianRupee, title: "INR Pricing & GST", desc: "Built-in GST rates, INR pricing, and tax-compliant invoices. Qwilr lacks Indian tax support." },
              { icon: Wallet, title: "Razorpay Native", desc: "Accept UPI, cards, and net banking inside the quote. Qwilr doesn't support Razorpay." },
              { icon: Infinity, title: "Free Tier", desc: "Start at $0 with 50 quotes/month. Qwilr starts at $35/month with no free plan." },
              { icon: Users, title: "Deal Rooms", desc: "Clients can negotiate and counter-offer inside the quote. Qwilr lacks this feature." },
              { icon: Globe, title: "Indian-First Approach", desc: "Built from the ground up for Indian businesses — from pricing to payment gateways." },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
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
              { q: "Is SendQuote better than Qwilr?", a: "For Indian businesses and budget-conscious teams, yes. SendQuote offers AI drafting, GST support, Razorpay, deal rooms, and a free tier. Qwilr excels at interactive branded pages but costs more." },
              { q: "Does Qwilr have AI proposal generation?", a: "No. Qwilr does not offer AI-powered proposal or quote generation. SendQuote uses AI to draft complete quotes from a brief description in under 60 seconds." },
              { q: "Does Qwilr support Indian payments?", a: "No. Qwilr supports Stripe and PayPal but does not integrate with Razorpay. SendQuote has native Razorpay support for UPI, cards, and net banking." },
              { q: "Is there a free alternative to Qwilr?", a: "Yes. SendQuote offers a free Starter plan with 50 quotes/month, e-signature, and basic templates — no credit card required." },
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
