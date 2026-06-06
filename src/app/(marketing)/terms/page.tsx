import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Terms of Service — SendQuote",
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl prose prose-neutral dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: June 2026</p>
          <h2>Acceptance of Terms</h2>
          <p>By using SendQuote, you agree to these terms. If you do not agree, do not use the service.</p>
          <h2>Service Description</h2>
          <p>SendQuote provides an AI-powered quoting and revenue workflow platform. We reserve the right to modify or discontinue features with notice.</p>
          <h2>User Obligations</h2>
          <p>You are responsible for maintaining account security and ensuring your use complies with applicable laws.</p>
          <h2>Payment Terms</h2>
          <p>Paid plans are billed monthly or annually. Refunds are handled per our refund policy.</p>
          <h2>Limitation of Liability</h2>
          <p>SendQuote is provided &quot;as is&quot; without warranties. Liability is limited to the amount paid in the last 12 months.</p>
          <h2>Contact</h2>
          <p>For questions: support@sendquote.in</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
