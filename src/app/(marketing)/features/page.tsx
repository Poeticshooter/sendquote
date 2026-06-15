import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Features: AI Quoting, GST Invoices, Deal Rooms & e-Signature for Indian Businesses",
  description:
    "Explore SendQuote's AI-powered quoting features built for Indian SMBs: AI quote generator (60 seconds), interactive deal rooms, e-signature collection, GST-ready invoices, buyer intent tracking, CRM sync, approval workflows, and team collaboration. Everything you need to close deals faster.",
  openGraph: {
    title: "Features: AI Quoting, GST Invoices, Deal Rooms & e-Signature for Indian Businesses",
    description:
      "AI-powered quoting (60 seconds), interactive deal rooms with e-signature, GST-compliant invoices, buyer intent tracking, CRM sync (HubSpot/Pipedrive), and team collaboration. Built for Indian businesses.",
    url: "https://sendquote.in/features",
    siteName: "SendQuote",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://sendquote.in/og-image.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Features: AI Quoting, GST Invoices, Deal Rooms & e-Signature for Indian Businesses",
    description:
      "Create GST-ready quotes in 60 seconds with AI. Deal rooms, e-signature, Razorpay payments, buyer tracking, and CRM sync. Built for Indian SMBs.",
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
