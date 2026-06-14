import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Changelog: Product Updates & New Features | SendQuote",
  description: "Stay up to date with the latest SendQuote features, improvements, and bug fixes. AI quote generation, GST invoices, deal rooms, e-signatures, and more — shipped regularly.",
  openGraph: {
    title: "Changelog: New Features & Updates for Indian SMBs | SendQuote",
    description: "Latest SendQuote product updates including AI quote generation improvements, GST invoice features, deal room enhancements, CRM integrations, and platform improvements.",
    url: "https://sendquote.in/changelog",
    siteName: "SendQuote",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://sendquote.in/og-image.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog | SendQuote",
    description: "Latest updates, features, and improvements to SendQuote.",
  },
  alternates: { canonical: "https://sendquote.in/changelog" },
};

const changes = [
  { date: "2026-06-06", version: "1.0.0", items: ["AI quote generation with Grok integration", "Interactive Deal Room with real-time chat", "One-click e-signature", "Approval workflow engine", "CRM sync: HubSpot and Pipedrive", "Client portal with email lookup", "Win/loss analytics dashboard", "AI Deal Copilot with scoring", "GST-ready invoices", "Dark mode support"] },
];

export default function ChangelogPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Changelog</h1>
          <p className="mt-3 text-muted-foreground">Latest updates and improvements.</p>
          <div className="mt-10 space-y-10">
            {changes.map((release) => (
              <div key={release.version} className="border-l-2 border-foreground/10 pl-6">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-lg font-bold">v{release.version}</h2>
                  <span className="text-sm text-muted-foreground">{release.date}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {release.items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
