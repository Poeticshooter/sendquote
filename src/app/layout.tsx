import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/shared/posthog-provider";

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

export const metadata: Metadata = {
  title: {
    default: "SendQuote — AI-Powered Quotes That Close Deals Faster",
    template: "%s | SendQuote",
  },
  description:
    "SendQuote transforms quotations into interactive, AI-powered deal rooms. Generate quotes in 60 seconds, track buyer intent, collect payments, and close deals faster.",
  keywords: [
    "quote software",
    "proposal software",
    "AI quotes",
    "quoting platform",
    "sales proposal",
    "e-signature",
    "invoice software",
    "B2B quoting",
    "SendQuote",
  ],
  metadataBase: new URL("https://sendquote.in"),
  openGraph: {
    title: "SendQuote — AI-Powered Quotes That Close Deals Faster",
    description:
      "Transform quotations into interactive, AI-powered deal rooms. Generate, negotiate, and close deals in hours.",
    url: "https://sendquote.in",
    siteName: "SendQuote",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SendQuote",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SendQuote — AI-Powered Quotes That Close Deals Faster",
    description:
      "Transform quotations into interactive, AI-powered deal rooms. Generate, negotiate, and close deals in hours.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://sendquote.in",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${interSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "SendQuote",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "AI-powered quotation and revenue workflow platform. Generate, negotiate, approve, and close deals.",
              url: "https://sendquote.in",
              offers: [
                {
                  "@type": "Offer",
                  price: "19",
                  priceCurrency: "USD",
                  name: "Starter",
                },
                {
                  "@type": "Offer",
                  price: "79",
                  priceCurrency: "USD",
                  name: "Growth",
                },
                {
                  "@type": "Offer",
                  price: "199",
                  priceCurrency: "USD",
                  name: "Pro",
                },
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "SendQuote",
              url: "https://sendquote.in",
              logo: "https://sendquote.in/logo.png",
              sameAs: ["https://twitter.com/sendquote"],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          {children}
          <Toaster richColors position="top-right" />
        </PostHogProvider>
      </body>
    </html>
  );
}
