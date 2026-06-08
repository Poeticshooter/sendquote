import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "FAQ — SendQuote",
  description: "Answers to common questions about SendQuote, AI quote generation, pricing, payments, and integrations.",
  openGraph: { title: "FAQ | SendQuote" },
};

const faqs = [
  { q: "What is SendQuote?", a: "SendQuote is an AI-powered revenue workflow platform that helps businesses generate, negotiate, approve, and close deals in hours instead of weeks." },
  { q: "How does AI quote generation work?", a: "Describe your project briefly — AI generates complete line items, pricing, terms, and notes in under 60 seconds. Review and adjust before sending." },
  { q: "Can I accept payments inside the quote?", a: "Yes. Integrated Razorpay and Stripe allow buyers to sign and pay in one click. Supports credit cards, UPI, and bank transfers." },
  { q: "Which CRMs do you integrate with?", a: "HubSpot, Salesforce, and Pipedrive. Bi-directional sync creates deals from quotes and updates stages on acceptance." },
  { q: "Is there a free plan?", a: "Yes. Starter plan is free with 50 quotes per month, basic templates, e-signature, and buyer tracking." },
  { q: "Can clients negotiate inside the quote?", a: "Yes. The Deal Room allows clients to request changes, adjust quantities, and counter-offer — all inside the quote page." },
  { q: "Do you support GST invoices?", a: "Yes. GST rates and amounts are built into quotes and invoices. Auto-generate tax-compliant invoices on acceptance." },
  { q: "What payment providers are supported?", a: "Razorpay for Indian payments (UPI, cards, net banking) and Stripe for international payments." },
  { q: "How secure is my data?", a: "All data encrypted in transit (TLS) and at rest. RBAC controls access. SOC 2 compliance in progress." },
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
                <h3 className="font-semibold text-base">{faq.q}</h3>
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
