"use client"

import { useEffect } from "react"
import BrandLogo from "@/components/brand-logo"
import Button from "@/components/ui/button"
import ThemeToggle from "@/components/theme-toggle"
import HeroSection from "@/components/landing/hero-section"
import HowItWorksSection from "@/components/landing/how-it-works"
import { FeaturesSection, TestimonialsSection, FAQSection, PricingSection, CTASection, Footer } from "@/components/landing/sections"
import { faqs } from "@/components/landing/data"

export default function LandingPage() {
  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "FAQPage",
          mainEntity: faqs.map(faq => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
            },
          })),
        },
        {
          "@type": "Product",
          name: "SendQuote",
          description: "Professional quote generator for Indian businesses. Create GST-ready quotes, share via WhatsApp, track opens.",
          brand: { "@type": "Brand", name: "SendQuote" },
          offers: {
            "@type": "AggregateOffer",
            lowPrice: 0,
            highPrice: 799,
            priceCurrency: "INR",
            offerCount: 3,
            offers: [
              { "@type": "Offer", name: "Free", price: 0, priceCurrency: "INR", description: "Up to 5 quotes per month" },
              { "@type": "Offer", name: "Starter", price: 299, priceCurrency: "INR", description: "Unlimited quotes, custom branding" },
              { "@type": "Offer", name: "Professional", price: 799, priceCurrency: "INR", description: "All features, priority support" },
            ],
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "1250",
            bestRating: "5",
          },
        },
      ],
    }

    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button as="a" href="/login" variant="ghost" size="sm" aria-label="Sign in to your account">
              Sign In
            </Button>
            <Button as="a" href="/register" variant="primary" size="sm" aria-label="Create a free account">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <PricingSection />
      <Footer />
    </div>
  )
}
