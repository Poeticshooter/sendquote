import Link from "next/link";
import { ArrowRight, Zap, IndianRupee, Sparkles, Trophy } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ComparisonsGrid } from "./comparisons-grid";

export default function ComparisonsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="px-4 pt-28 pb-12 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-1 text-xs font-medium bg-[#00D4AA]/10 text-[#00D4AA] px-3 py-1 rounded-full mb-4">
            <Trophy className="w-3 h-3" />
            Honest Comparisons
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            SendQuote vs <span className="text-[#00D4AA]">The Competition</span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            We pit SendQuote head-to-head against the top quoting and proposal tools.
            No fluff, no bias — just honest feature-by-feature breakdowns so you can decide.
          </p>
        </section>

        {/* Comparison Grid */}
        <ComparisonsGrid />

        {/* Why Compare */}
        <section className="px-4 pb-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            What Makes SendQuote Different?
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: "AI-First Quoting", desc: "Generate complete quotes from a brief description in under 60 seconds. No other tool does this." },
              { icon: IndianRupee, title: "Built for India", desc: "INR pricing, GST support, Razorpay integration — purpose-built for Indian businesses." },
              { icon: Sparkles, title: "Free to Start", desc: "A generous free tier with 50 quotes/month. Most competitors charge $29-49/mo just to begin." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-card border border-border rounded-xl p-5 text-center">
                  <Icon className="w-6 h-6 text-[#00D4AA] mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-24 text-center">
          <div className="max-w-xl mx-auto bg-card border border-border rounded-xl p-8">
            <h2 className="text-2xl font-bold text-foreground">
              Ready to Try SendQuote?
            </h2>
            <p className="mt-2 text-gray-400">
              Start for free. No credit card required.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#00D4AA] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#00D4AA]/90 transition-colors duration-200"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-foreground transition-colors duration-200 text-sm"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
