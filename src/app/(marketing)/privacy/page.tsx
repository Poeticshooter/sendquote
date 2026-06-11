import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "SendQuote's privacy policy outlines how we collect, use, and protect your personal data in compliance with Indian data protection laws.",
  openGraph: {
    title: "Privacy Policy | SendQuote",
    description: "SendQuote's privacy policy outlines how we collect, use, and protect your personal data in compliance with Indian data protection laws.",
    url: "https://sendquote.in/privacy",
    siteName: "SendQuote",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://sendquote.in/og-image.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | SendQuote",
    description: "SendQuote's privacy policy — how we collect, use, and protect your data.",
  },
  robots: { index: false, follow: true },
  alternates: { canonical: "https://sendquote.in/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl prose prose-neutral dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: June 2026</p>
          <h2>Information We Collect</h2>
          <p>We collect information you provide when creating an account, creating quotes, and communicating with us. This includes your name, email address, business name, and payment information.</p>
          <h2>How We Use Your Information</h2>
          <p>We use your information to provide and improve our services, process payments, send transactional emails, and communicate product updates.</p>
          <h2>Data Security</h2>
          <p>All data is encrypted in transit (TLS) and at rest. We implement RBAC, audit logging, and regular security reviews.</p>
          <h2>Your Rights</h2>
          <p>You can request access, correction, or deletion of your data at any time by emailing support@sendquote.in.</p>
          <h2>Contact</h2>
          <p>For privacy inquiries: support@sendquote.in</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
