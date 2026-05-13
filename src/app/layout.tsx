import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/toast"
import ChatBot from "@/components/chat-bot"
import VoiceAssistant from "@/components/voice-assistant"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  metadataBase: new URL("https://sendquote.in"),
  title: {
    default: "SendQuote — Professional Quotes for Indian Businesses",
    template: "%s | SendQuote",
  },
  description: "Create professional quotes in minutes, share via WhatsApp, track opens & closes. Built for Indian contractors, freelancers & small businesses. GST-ready, mobile-friendly, no app needed for clients.",
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
    "sendquote",
  ],
  authors: [{ name: "SendQuote" }],
  creator: "SendQuote",
  publisher: "SendQuote",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://sendquote.in",
    siteName: "SendQuote",
    title: "SendQuote — Professional Quotes for Indian Businesses",
    description: "Create professional quotes in minutes, share via WhatsApp, track opens & closes. Built for Indian businesses. GST-ready, mobile-friendly.",
images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "SendQuote — Send quotes that close deals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SendQuote — Professional Quotes for Indian Businesses",
    description: "Create professional quotes in minutes, share via WhatsApp, track opens & closes.",
    images: ["/og-image.svg"],
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
  alternates: {
    canonical: "https://sendquote.in",
  },
  category: "Business Tools",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <ToastProvider>
          {children}
          <VoiceAssistant />
          <ChatBot />
        </ToastProvider>
      </body>
    </html>
  )
}