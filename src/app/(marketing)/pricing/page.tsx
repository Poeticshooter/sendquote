import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { PricingTable } from "@/components/landing/pricing-table";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for businesses of all sizes. Start free, upgrade as you grow.",
  openGraph: {
    title: "SendQuote Pricing",
    description: "Simple, transparent pricing for businesses of all sizes.",
  },
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <div className="px-4 pt-16 pb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade as you grow. No hidden fees.
          </p>
        </div>
        <PricingTable />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
