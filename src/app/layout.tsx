import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/shared/posthog-provider";
import { Suspense } from "react";

const interSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "SendQuote — AI-Powered Quotes That Close Deals Faster",
    template: "%s | SendQuote",
  },
  description:
    "SendQuote transforms quotations into interactive, AI-powered deal rooms. Generate quotes in 60 seconds, track buyer intent, collect payments, and close deals faster.",
  keywords: [
    "quote software", "proposal software", "AI quotes", "quoting platform",
    "sales proposal", "e-signature", "invoice software", "B2B quoting",
    "SendQuote", "quote maker India", "quotation software",
    "GST invoice generator", "business quote app",
  ],
  metadataBase: new URL("https://sendquote.in"),
  authors: [{ name: "SendQuote" }],
  creator: "SendQuote",
  publisher: "SendQuote",
  category: "Business Tools",
  openGraph: {
    title: "SendQuote — AI-Powered Quotes That Close Deals Faster",
    description:
      "Transform quotations into interactive, AI-powered deal rooms. Generate, negotiate, and close deals in hours.",
    url: "https://sendquote.in",
    siteName: "SendQuote",
    locale: "en_IN",
    type: "website",
    images: [
      { url: "https://sendquote.in/og-image.svg", width: 1200, height: 630, alt: "SendQuote" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SendQuote — AI-Powered Quotes That Close Deals Faster",
    description:
      "Transform quotations into interactive, AI-powered deal rooms. Generate, negotiate, and close deals in hours.",
    images: ["https://sendquote.in/og-image.svg"],
    site: "@sendquote",
    creator: "@sendquote",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: "https://sendquote.in" },
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  manifest: "/manifest.json",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://sendquote.in/#organization",
      name: "SendQuote",
      url: "https://sendquote.in",
      logo: "https://sendquote.in/favicon.svg",
      address: { "@type": "PostalAddress", addressCountry: "IN" },
      sameAs: ["https://twitter.com/sendquote"],
      contactPoint: {
        "@type": "ContactPoint", email: "support@sendquote.in",
        contactType: "customer support", availableLanguage: ["English", "Hindi"],
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://sendquote.in/#software",
      name: "SendQuote",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Starter" },
        { "@type": "Offer", price: "79", priceCurrency: "USD", name: "Growth" },
        { "@type": "Offer", price: "199", priceCurrency: "USD", name: "Pro" },
      ],
      featureList: [
        "AI quote generation", "Interactive deal rooms", "Buyer intent tracking",
        "E-signature", "Payment collection", "CRM integration",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://sendquote.in/#website",
      url: "https://sendquote.in",
      name: "SendQuote",
      description: "AI-powered quotation and revenue workflow platform.",
      publisher: { "@id": "https://sendquote.in/#organization" },
      inLanguage: "en-IN",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://sendquote.in/dashboard?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${interSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://yabsujbilznpoayueokq.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.razorpay.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster richColors position="top-right" />
        </PostHogProvider>
      </body>
    </html>
  );
}
