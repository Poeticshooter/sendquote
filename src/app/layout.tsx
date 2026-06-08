import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/shared/posthog-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { CookieConsent } from "@/components/shared/cookie-consent";
import { SkipNav } from "@/components/shared/skip-nav";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Suspense } from "react";
import { VoiceAssistant } from "@/components/shared/voice-assistant";
import { GoogleAnalytics } from "@/components/shared/google-analytics";

const interSans = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#0f172a" }],
};

export const metadata: Metadata = {
  title: { default: "SendQuote — AI-Powered Quoting for Indian Businesses", template: "%s | SendQuote" },
  description: "SendQuote helps Indian businesses create GST-ready quotes in 60 seconds. AI-powered quoting, e-signature, buyer tracking, and CRM sync in one platform.",
  keywords: ["quote software India", "GST invoice generator", "AI quotes", "quoting platform", "e-signature", "quotation software", "Indian business tools", "SendQuote", "quote maker India", "proposal software", "sales quoting software"],
  metadataBase: new URL("https://sendquote.in"),
  authors: [{ name: "SendQuote" }], creator: "SendQuote", publisher: "SendQuote", category: "Business Tools",
  openGraph: {
    title: "SendQuote — AI-Powered Quoting for Indian Businesses",
    description: "Create GST-ready quotes in 60 seconds with AI. Send interactive deal rooms, collect e-signatures, and close deals faster.",
    url: "https://sendquote.in", siteName: "SendQuote", locale: "en_IN", type: "website",
    images: [{ url: "https://sendquote.in/og-image-v2.svg", width: 1200, height: 630, alt: "SendQuote - AI Quote Generation Platform" }],
  },
  twitter: {
    card: "summary_large_image", site: "@sendquote", creator: "@sendquote",
    title: "SendQuote — AI-Powered Quoting for Indian Businesses",
    description: "Create GST-ready quotes in 60 seconds with AI. Send interactive deal rooms, collect e-signatures, close deals faster.",
    images: ["https://sendquote.in/og-image-v2.svg"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
  alternates: { canonical: "https://sendquote.in", languages: { "en-IN": "https://sendquote.in" } },
  icons: { icon: "/favicon-v2.svg", apple: "/favicon-v2.svg" },
  manifest: "/manifest.json",
  other: { "google-site-verification": process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization", "@id": "https://sendquote.in/#organization",
      name: "SendQuote", alternateName: "SendQuote India", url: "https://sendquote.in",
      logo: { "@type": "ImageObject", url: "https://sendquote.in/logo-white-v2.svg", width: 512, height: 512 },
      address: { "@type": "PostalAddress", addressCountry: "IN" },
      sameAs: ["https://twitter.com/sendquote", "https://sendquote.in"],
      contactPoint: [
        { "@type": "ContactPoint", email: "support@sendquote.in", contactType: "customer support", availableLanguage: ["English", "Hindi"] },
        { "@type": "ContactPoint", email: "sales@sendquote.in", contactType: "sales", availableLanguage: ["English", "Hindi"] },
      ],
      foundingDate: "2025",
      description: "AI-powered quoting and revenue workflow platform for Indian businesses.",
    },
    {
      "@type": "SoftwareApplication", "@id": "https://sendquote.in/#software",
      name: "SendQuote", applicationCategory: "BusinessApplication", operatingSystem: "Web",
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "INR", name: "Starter", description: "Free plan with 50 quotes/month" },
        { "@type": "Offer", price: "6499", priceCurrency: "INR", name: "Growth", description: "Unlimited quotes + AI features" },
        { "@type": "Offer", price: "16499", priceCurrency: "INR", name: "Pro", description: "Unlimited everything + priority support" },
      ],
      featureList: ["AI quote generation", "Interactive deal rooms", "Buyer intent tracking", "E-signature", "GST invoices", "CRM integration", "Approval workflows", "Team collaboration"],
      screenshot: "https://sendquote.in/og-image-v2.svg",
      softwareVersion: "2.0",
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "127", bestRating: "5" },
    },
    {
      "@type": "WebSite", "@id": "https://sendquote.in/#website",
      url: "https://sendquote.in", name: "SendQuote",
      description: "AI-powered quotation and revenue workflow platform for Indian businesses.",
      publisher: { "@id": "https://sendquote.in/#organization" }, inLanguage: "en-IN",
      potentialAction: { "@type": "SearchAction", target: "https://sendquote.in/dashboard?q={search_term_string}", "query-input": "required name=search_term_string" },
    },
    {
      "@type": "BreadcrumbList", "@id": "https://sendquote.in/#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://sendquote.in" },
        { "@type": "ListItem", position: 2, name: "Features", item: "https://sendquote.in/features" },
        { "@type": "ListItem", position: 3, name: "Pricing", item: "https://sendquote.in/pricing" },
        { "@type": "ListItem", position: 4, name: "Blog", item: "https://sendquote.in/blog" },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${interSans.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION} />
        )}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SendQuote" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="SendQuote" />
        <link rel="search" type="application/opensearchdescription+xml" title="SendQuote" href="/opensearch.xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://yabsujbilznpoayueokq.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.razorpay.com" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SkipNav />
        <ThemeProvider>
          <PostHogProvider>
            <Suspense fallback={null}>
              <GoogleAnalytics />
              {children}
            </Suspense>
            <CookieConsent />
            <Toaster richColors position="top-right" />
            <Analytics />
            <SpeedInsights />
            <VoiceAssistant />
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
