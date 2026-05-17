import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/toast"
import ChatBot from "@/components/chat-bot"
import VoiceAssistant from "@/components/voice-assistant"
import I18nWrapper from "@/components/i18n-wrapper"
import ErrorBoundary from "@/components/error-boundary"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SendQuote",
  },
  metadataBase: new URL("https://sendquote.in"),
  title: {
    default: "SendQuote — Professional Quote Generator for Indian Businesses",
    template: "%s | SendQuote",
  },
  description: "Create professional GST-ready quotes in 5 minutes. Share via WhatsApp, track opens, accept payments online. Built for Indian contractors, freelancers & small businesses. Free plan available.",
  keywords: [
    "quote maker India",
    "quotation software",
    "professional quote creator",
    "GST invoice generator",
    "business quote app",
    "contractor quote builder",
    "WhatsApp quote sharing",
    "quote tracking India",
    "Indian business quotes",
    "free quote generator",
    "sendquote",
    "send quote online",
    "GST quotation format",
  ],
  authors: [{ name: "SendQuote", url: "https://sendquote.in" }],
  creator: "SendQuote",
  publisher: "SendQuote",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://sendquote.in",
    siteName: "SendQuote",
    title: "SendQuote — Professional Quote Generator for Indian Businesses",
    description: "Create professional GST-ready quotes in 5 minutes. Share via WhatsApp, track opens, accept payments online. Free plan available.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SendQuote — Send quotes that close deals. Professional quote generator for Indian businesses.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SendQuote — Professional Quote Generator for Indian Businesses",
    description: "Create professional GST-ready quotes in 5 minutes. Share via WhatsApp, track opens, accept payments online.",
    images: ["/og-image.png"],
    site: "@sendquote",
    creator: "@sendquote",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Business Tools",
  other: {
    "google-site-verification": "",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://sendquote.in/#organization",
        name: "SendQuote",
        url: "https://sendquote.in",
        logo: {
          "@type": "ImageObject",
          url: "https://sendquote.in/favicon.svg",
        },
        sameAs: [],
        contactPoint: {
          "@type": "ContactPoint",
          email: "support@sendquote.in",
          contactType: "customer support",
          availableLanguage: ["English", "Hindi"],
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://sendquote.in/#software",
        name: "SendQuote",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
          description: "Free plan available with up to 5 quotes per month",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "1250",
          bestRating: "5",
          worstRating: "1",
        },
        featureList: [
          "Professional quote creation",
          "GST-ready invoices",
          "WhatsApp sharing",
          "Quote tracking",
          "Client acceptance",
          "PDF generation",
          "Multi-language support",
          "Voice assistant",
        ],
        screenshot: {
          "@type": "ImageObject",
          url: "https://sendquote.in/og-image.png",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://sendquote.in/#website",
        url: "https://sendquote.in",
        name: "SendQuote",
        publisher: { "@id": "https://sendquote.in/#organization" },
        potentialAction: {
          "@type": "SearchAction",
          target: "https://sendquote.in/dashboard?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  }

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://app.sendquote.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.razorpay.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
        <I18nWrapper>
          <ToastProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <VoiceAssistant />
            <ChatBot />
          </ToastProvider>
        </I18nWrapper>
      </body>
    </html>
  )
}
