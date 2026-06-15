import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { PricingTable } from "@/components/landing/pricing-table";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Pricing: Free, Growth & Pro Plans for Indian SMBs (₹0–₹16,499/yr)",
  description: "SendQuote pricing for Indian businesses — start free with 5 GST-ready quotes/month. Growth at ₹499/mo includes AI quote generation, e-signatures, CRM sync, and buyer chat. No hidden fees. Cancel anytime.",
  openGraph: {
    title: "Pricing: Free, Growth & Pro Plans for Indian SMBs (₹0–₹16,499/yr)",
    description: "Start free with 5 GST-ready quotes/month. Growth at ₹499/mo includes AI generation, e-signatures, CRM sync, and buyer chat.",
  },
};

const reviewSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      name: "SendQuote",
      description: "AI-powered quoting and revenue workflow platform",
      brand: { "@type": "Brand", name: "SendQuote" },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "INR",
        lowPrice: 0,
        highPrice: 16499,
        offerCount: 3,
        offers: [
          { "@type": "Offer", name: "Starter", price: 0, priceCurrency: "INR" },
          { "@type": "Offer", name: "Growth", price: 6499, priceCurrency: "INR" },
          { "@type": "Offer", name: "Pro", price: 16499, priceCurrency: "INR" },
        ],
      },
    },
    {
      "@type": "HowTo",
      name: "How to Create a Quote with SendQuote",
      description: "Create and send a professional quote in 4 simple steps.",
      step: [
        { "@type": "HowToStep", name: "Describe", text: "Describe your project briefly to AI" },
        { "@type": "HowToStep", name: "Review", text: "AI generates line items and pricing. Review and adjust." },
        { "@type": "HowToStep", name: "Send", text: "Share an interactive quote link with your client" },
        { "@type": "HowToStep", name: "Close", text: "Client signs and pays — deal closed in minutes" },
      ],
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }} />
      <Navbar />
      <main>
        <div className="px-4 pt-16 pb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">Start free. Upgrade as you grow. No hidden fees.</p>
        </div>
        <PricingTable />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
