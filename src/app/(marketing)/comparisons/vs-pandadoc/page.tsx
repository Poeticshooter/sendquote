import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
// import { m } from "@/components/shared/motion-client";
import {
  ArrowRight,
  Check,
  X,
  IndianRupee,
  Zap,
  Smartphone,
  Infinity,
  Wallet,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SendQuote vs PandaDoc",
  description:
    "Compare SendQuote vs PandaDoc for Indian businesses. See why SendQuote wins on AI quoting, GST support, Razorpay payments, and pricing.",
  openGraph: { title: "SendQuote vs PandaDoc: Which Is Better for Indian Businesses?" },
};

const features = [
  { name: "AI Quote Drafting", ours: true, theirs: true, note: "PandaDoc has basic AI; SendQuote is purpose-built for quoting" },
  { name: "India Pricing (INR)", ours: true, theirs: false, note: "PandaDoc only bills in USD" },
  { name: "GST Support", ours: true, theirs: false },
  { name: "Razorpay Integration", ours: true, theirs: false },
  { name: "Deal Rooms (Negotiation)", ours: true, theirs: true },
  { name: "E-signature", ours: true, theirs: true },
  { name: "Free Tier", ours: true, theirs: false, note: "PandaDoc free plan removed in 2024" },
  { name: "Mobile App", ours: true, theirs: true },
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
    { plan: "Essentials", price: "$35/mo", features: "Unlimited docs, e-sign, 5 users" },
    { plan: "Business", price: "$65/mo", features: "Approval workflows, CRM, templates" },
    { plan: "Enterprise", price: "Custom", features: "Dedicated support, SSO, API" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is SendQuote better than PandaDoc?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For Indian SMBs, yes. SendQuote offers AI-powered quoting, GST support, Razorpay payments, and a free tier — starting at $0. PandaDoc is better suited for US/European enterprises with larger budgets.",
      },
    },
    {
      "@type": "Question",
      name: "Does PandaDoc support GST invoices?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No, PandaDoc does not have built-in GST or Indian tax support. SendQuote handles GST rates, invoices, and tax-compliant documents natively.",
      },
    },
    {
      "@type": "Question",
      name: "Can I accept Razorpay payments with PandaDoc?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. PandaDoc supports Stripe and PayPal but does not integrate with Razorpay. SendQuote has native Razorpay integration for UPI, cards, and net banking.",
      },
    },
    {
      "@type": "Question",
      name: "Which is more affordable for startups — SendQuote or PandaDoc?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SendQuote is significantly more affordable. The free Starter plan covers 50 quotes/month, while PandaDoc's cheapest plan is $35/month with no free tier.",
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

export default function VsPandaDocPage() {
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
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
              Comparison
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              SendQuote vs PandaDoc
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Which quoting tool is better for Indian businesses? We break down
              features, pricing, and localisation side by side.
            </p>
          </div>
        </section>

        {/* Quick verdict */}
        <section className="px-4 pb-12 max-w-4xl mx-auto">
          <div
            className="bg-card border border-border rounded-xl p-6 md:p-8"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Quick Verdict</h2>
            </div>
            <p className="text-muted-foreground">
              <strong className="text-foreground">SendQuote wins for Indian SMBs.</strong> PandaDoc is a mature
              document automation platform, but its US-centric pricing (no INR,
              starts at $35/mo), lack of GST support, and absent Razorpay
              integration make it expensive and ill-suited for the Indian market.
              SendQuote delivers AI-powered quoting, native GST, Razorpay
              payments, and a generous free tier — everything an Indian business
              needs to start quoting today.
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
                  <th className="pb-3 px-4 text-center text-sm font-semibold text-muted-foreground">PandaDoc</th>
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
                <Check className="w-5 h-5" /> SendQuote
              </h3>
              <div className="space-y-3">
                {pricingData.ours.map((p) => (
                  <PricingCard key={p.plan} {...p} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <X className="w-5 h-5" /> PandaDoc
              </h3>
              <div className="space-y-3">
                {pricingData.theirs.map((p) => (
                  <PricingCard key={p.plan} {...p} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why SendQuote wins */}
        <section className="px-4 pb-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Why SendQuote Wins for Indian SMBs
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Zap, title: "AI-Powered Quoting", desc: "Generate complete quotes from a brief description in under 60 seconds. PandaDoc's AI is generic." },
              { icon: IndianRupee, title: "INR Pricing & GST", desc: "Priced in INR with built-in GST rates, invoice generation, and tax-compliant documents." },
              { icon: Wallet, title: "Razorpay Native", desc: "Accept UPI, credit cards, and net banking inside the quote. PandaDoc doesn&apos;t support Razorpay." },
              { icon: Infinity, title: "Free Tier Available", desc: "Start at $0 with 50 quotes/month. PandaDoc's cheapest plan is $35/month." },
              { icon: Smartphone, title: "Mobile-Optimised", desc: "Full mobile experience for sending quotes on the go. Buyers can view, negotiate, and sign from any device." },
              { icon: Users, title: "Built for Indian Teams", desc: "Multi-user, deal rooms, approval workflows — tailored for how Indian businesses operate." },
            ].map((item, _idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-card border border-border rounded-xl p-5"
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
              { q: "Is SendQuote better than PandaDoc?", a: "For Indian SMBs, yes. SendQuote offers AI-powered quoting, GST support, Razorpay payments, and a free tier. PandaDoc is better suited for US/European enterprises with larger budgets." },
              { q: "Does PandaDoc support GST invoices?", a: "No. PandaDoc does not have built-in GST or Indian tax support. SendQuote handles GST rates, invoices, and tax-compliant documents natively." },
              { q: "Can I accept Razorpay payments with PandaDoc?", a: "No. PandaDoc supports Stripe and PayPal but does not integrate with Razorpay. SendQuote has native Razorpay integration for UPI, cards, and net banking." },
              { q: "Which is more affordable — SendQuote or PandaDoc?", a: "SendQuote is significantly more affordable. The free Starter plan covers 50 quotes/month, while PandaDoc's cheapest plan is $35/month." },
            ].map((faq) => (
              <details key={faq.q} className="group bg-card border border-border rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer text-foreground font-medium text-sm list-none transition-colors duration-200 hover:text-primary">
                  {faq.q}
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform duration-200 flex-shrink-0" />
                </summary>
                <div className="px-4 pb-4 text-sm text-muted-foreground">
                  {faq.a}
                </div>
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
