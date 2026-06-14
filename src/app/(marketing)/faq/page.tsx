import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "FAQ: GST Invoicing, AI Quotes & Pricing Questions Answered | SendQuote",
  description:
    "All your questions about SendQuote's AI-powered quoting platform answered: GST invoices, free plan limits, pricing, e-signatures, payment integration, data security, and team collaboration for Indian businesses.",
  openGraph: {
    title: "FAQ: AI Quoting, GST Invoices & Pricing for Indian SMBs | SendQuote",
    description: "Get answers about SendQuote's AI-powered quoting platform — free plan (5 quotes/mo), GST invoices, e-signatures, payment integration, and team features.",
    url: "https://sendquote.in/faq",
    siteName: "SendQuote",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://sendquote.in/og-image.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ: GST Invoicing, AI Quotes & Pricing | SendQuote",
    description: "Free plan includes 5 GST-ready quotes/month. AI generation, e-signatures, buyer tracking, and Razorpay integration for Indian businesses.",
  },
  alternates: { canonical: "https://sendquote.in/faq" },
};

const faqs = [
  { q: "What is SendQuote?", a: "SendQuote is an AI-powered revenue workflow platform that helps businesses generate, negotiate, approve, and close deals in hours instead of weeks." },
  { q: "How does AI quote generation work?", a: "Describe your project briefly — AI generates complete line items, pricing, terms, and notes in under 60 seconds. Review and adjust before sending." },
  { q: "Can I accept payments inside the quote?", a: "Yes. Integrated Razorpay and Stripe allow buyers to sign and pay in one click. Supports credit cards, UPI, and bank transfers." },
  { q: "Which CRMs do you integrate with?", a: "HubSpot, Salesforce, and Pipedrive. Bi-directional sync creates deals from quotes and updates stages on acceptance." },
  { q: "Is there a free plan?", a: "Yes. Starter plan is free with 5 quotes per month, basic templates, e-signature, and buyer tracking." },
  { q: "Can clients negotiate inside the quote?", a: "Yes. The Deal Room allows clients to request changes, adjust quantities, and counter-offer — all inside the quote page." },
  { q: "Do you support GST invoices?", a: "Yes. GST rates and amounts are built into quotes and invoices. Auto-generate tax-compliant invoices on acceptance." },
  { q: "What payment providers are supported?", a: "Razorpay for Indian payments (UPI, cards, net banking) and Stripe for international payments." },
  { q: "How secure is my data?", a: "All data encrypted in transit (TLS) and at rest. RBAC controls access. SOC 2 compliance in progress." },
  { q: "How long does it take to get started?", a: "Under 2 minutes. Sign up, get a welcome email, and create your first AI-powered quote immediately. No onboarding calls needed." },
  { q: "Can I export my data?", a: "Yes. Export all quotes, invoices, and client data as CSV/JSON from settings. You own your data entirely." },
  { q: "Do you offer team collaboration?", a: "Yes. Paid plans allow team members to collaborate on quotes, manage approval workflows, and share deal rooms." },
  { q: "What happens when I exceed my plan limit?", a: "We'll notify you by email. You can upgrade instantly from Settings — no proration charges, immediate access to higher limits." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from Settings with one click. No lock-in contracts. Your data remains accessible on read-only basis until billing period ends." },
  { q: "Do you offer discounts for annual billing?", a: "Yes. Annual plans save 20% compared to monthly billing. Pay for 10 months, get 12 months of access." },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently Asked Questions</h1>
          <p className="mt-3 text-gray-400">Everything you need to know about SendQuote.</p>
          <div className="mt-10 space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border bg-card p-6">
                <h2 className="font-semibold text-base">{faq.q}</h2>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
