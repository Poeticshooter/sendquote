import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the SendQuote team. We're here to help with questions about AI quoting, pricing, integrations, or anything else.",
  openGraph: {
    title: "Contact | SendQuote",
    description: "Get in touch with the SendQuote team. We're here to help with questions about AI quoting, pricing, integrations, or anything else.",
    url: "https://sendquote.in/contact",
    siteName: "SendQuote",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://sendquote.in/og-image.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact | SendQuote",
    description: "Get in touch with the SendQuote team. We're here to help.",
  },
  alternates: { canonical: "https://sendquote.in/contact" },
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact Us</h1>
          <p className="mt-3 text-gray-400">We&apos;d love to hear from you.</p>
          <div className="mt-10 grid gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="font-semibold">Email</h2>
              <p className="mt-1 text-sm text-gray-400">
                <a href="mailto:support@sendquote.in" className="text-foreground hover:underline">support@sendquote.in</a>
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h2 className="font-semibold">Sales</h2>
              <p className="mt-1 text-sm text-gray-400">
                <a href="mailto:sales@sendquote.in" className="text-foreground hover:underline">sales@sendquote.in</a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
