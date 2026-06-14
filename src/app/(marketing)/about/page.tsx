import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "About SendQuote: AI-Powered Quoting & Invoicing for Indian SMBs",
  description:
    "SendQuote is an AI-powered quoting and revenue workflow platform built for Indian small and medium businesses. Create GST-ready quotes in 60 seconds, send interactive deal rooms, collect e-signatures, and get paid faster.",
  openGraph: {
    title: "About SendQuote — The Fastest Path from Conversation to Contract",
    description:
      "Founded in 2025, SendQuote helps Indian SMBs create AI-powered quotes, send interactive deal rooms, collect e-signatures, and accept payments — all in one platform.",
    url: "https://sendquote.in/about",
    siteName: "SendQuote",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://sendquote.in/og-image.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About SendQuote — AI-Powered Quoting for Indian Businesses",
    description:
      "SendQuote is the revenue workflow platform built for Indian SMBs. Create GST-ready quotes with AI, send deal rooms, collect e-signatures, and accept payments.",
  },
  alternates: { canonical: "https://sendquote.in/about" },
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight">About SendQuote</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            The fastest path from conversation to contract. Built for Indian small and medium businesses.
          </p>

          <div className="mt-12 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold">What is SendQuote?</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                SendQuote is an AI-powered revenue workflow platform designed specifically for Indian small and medium businesses.
                It replaces manual quotation processes, scattered email threads, and disconnected invoicing with a single
                platform: create GST-compliant quotes in 60 seconds, send interactive deal rooms, collect e-signatures,
                and accept payments — all in one place.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">The Problem</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Indian SMBs lose deals every day because creating professional quotes takes too long,
                sending them is cumbersome, and tracking client responses is impossible with email attachments.
                Existing tools are either too complex (ERP systems) or not India-specific (global SaaS
                that doesn't understand GST, UPI, or WhatsApp-based business communication).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">The Solution</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                SendQuote brings together AI-powered quote generation, GST-ready invoicing, interactive
                deal rooms with e-signature, Razorpay payment integration, buyer intent tracking, and
                CRM sync into one seamless workflow. From describing a project to getting paid, the
                entire process takes minutes instead of days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">Key Features</h2>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>• <strong>AI Quote Generation</strong> — Describe your project, get complete line items and pricing in 60 seconds</li>
                <li>• <strong>Interactive Deal Rooms</strong> — Clients can view, negotiate, sign, and pay in one page</li>
                <li>• <strong>GST-Compliant Invoicing</strong> — Auto-generated invoices with CGST/SGST/IGST split on acceptance</li>
                <li>• <strong>E-Signature Collection</strong> — Legally valid electronic signatures built into the quote flow</li>
                <li>• <strong>Razorpay Payments</strong> — Accept UPI, credit cards, and net banking</li>
                <li>• <strong>Buyer Intent Tracking</strong> — See when clients open, view, and engage with quotes</li>
                <li>• <strong>CRM Integration</strong> — Bi-directional sync with HubSpot, Salesforce, and Pipedrive</li>
                <li>• <strong>Team Collaboration</strong> — Approval workflows and shared deal rooms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">Who It's For</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Freelance consultants, small manufacturing businesses, service providers, interior designers,
                digital marketing agencies, IT services firms, and any Indian business that sends quotes
                and invoices to clients.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">Our Mission</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Every Indian small business deserves the same sales tools that large enterprises use.
                SendQuote makes enterprise-grade quoting, invoicing, and revenue workflow accessible
                to every SMB — at a price they can afford, with the India-specific features they need.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
