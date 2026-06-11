import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Learn how to use SendQuote to create, send, and close quotes faster with step-by-step guides, tutorials, and API references.",
  openGraph: {
    title: "Documentation | SendQuote",
    description: "Learn how to use SendQuote to create, send, and close quotes faster with step-by-step guides, tutorials, and API references.",
    url: "https://sendquote.in/docs",
    siteName: "SendQuote",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://sendquote.in/og-image.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Documentation | SendQuote",
    description: "Learn how to use SendQuote to create, send, and close quotes faster.",
  },
  alternates: { canonical: "https://sendquote.in/docs" },
};

const sections = [
  { title: "Getting Started", items: ["Creating your account", "Setting up your business profile", "Your first quote", "Understanding the dashboard"] },
  { title: "Quotes", items: ["Creating a quote", "Using AI to generate quotes", "Adding line items", "Setting pricing and discounts", "Quote templates"] },
  { title: "Deal Room", items: ["What is a Deal Room?", "Sharing quotes with clients", "Client chat and negotiation", "Tracking buyer activity"] },
  { title: "E-Signature & Invoices", items: ["E-signature collection", "Invoice generation", "GST-compliant invoices"] },
  { title: "Workflows", items: ["Approval rules", "AI follow-ups", "Quote expiry settings"] },
  { title: "Integrations", items: ["CRM sync (HubSpot, Pipedrive)", "Webhook configuration", "n8n workflow automation"] },
];

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Documentation</h1>
          <p className="mt-3 text-gray-400">Everything you need to get started with SendQuote.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <div key={section.title} className="rounded-xl border bg-card p-6">
                <h2 className="font-semibold">{section.title}</h2>
                <ul className="mt-3 space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="text-sm text-gray-400 hover:text-foreground cursor-default transition-colors">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
