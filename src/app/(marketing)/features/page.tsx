import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore SendQuote's AI-powered quoting features: smart quotes, deal rooms, e-signatures, buyer tracking, GST invoices, CRM sync, and team collaboration.",
  openGraph: {
    title: "Features | SendQuote",
    description:
      "Explore SendQuote's AI-powered quoting features: smart quotes, deal rooms, e-signatures, buyer tracking, GST invoices, CRM sync, and team collaboration.",
    url: "https://sendquote.in/features",
    siteName: "SendQuote",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://sendquote.in/og-image.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Features | SendQuote",
    description:
      "Explore SendQuote's AI-powered quoting features: smart quotes, deal rooms, e-signatures, buyer tracking, GST invoices, CRM sync, and team collaboration.",
  },
  alternates: { canonical: "https://sendquote.in/features" },
};

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main>
        <div className="px-4 pt-20 pb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Features</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Everything you need to close deals faster — from AI quote generation to e-signature.
          </p>
        </div>
        <FeaturesGrid />
      </main>
      <Footer />
    </>
  );
}
