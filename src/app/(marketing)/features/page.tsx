import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Features — SendQuote",
  description: "Discover how SendQuote helps you create, send, and close quotes faster with AI-powered features.",
  openGraph: { title: "Features | SendQuote" },
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
