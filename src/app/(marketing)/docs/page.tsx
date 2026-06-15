"use client";

import { useState } from "react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import type { LucideProps } from "lucide-react";
import {
  ChevronDown,
  FileText,
  IndianRupee,
  Eye,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

interface Section {
  id: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  title: string;
  content: () => React.ReactNode;
}

function ExpandableSection({ icon: Icon, title, children }: { icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className=&quot;flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary shrink-0" />
          <span className="font-semibold text-foreground">{title}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed space-y-3 border-t border-border pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

const sections: Section[] = [
  {
    id: &quot;getting-started",
    icon: FileText,
    title: "Getting Started — Create Your First Quote in 2 Minutes",
    content: () => (
      <>
        <h4 className="font-semibold text-foreground">1. Sign Up</h4>
        <p>Go to <Link href="/signup" className="text-primary hover:underline">sendquote.in/signup</Link>. Enter your email and create a password. No credit card needed.</p>
        <p>You can also sign up with Google — one click, no password to remember.</p>

        <h4 className="font-semibold text-foreground pt-3">2. Business Profile</h4>
        <p>After signing up, enter your business name and phone. This appears on every quote and invoice you send. Add your GST number, address, and UPI ID later in Settings.</p>

        <h4 className="font-semibold text-foreground pt-3">3. Create a Quote</h4>
        <p>Click <strong>&quot;Create Quote"</strong> from the dashboard or quotes page.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Enter the client name and email</li>
          <li>Add line items: description, quantity, rate — HSN code is optional for initial drafts</li>
          <li>Set GST rate — the system automatically splits into CGST + SGST (intra-state) or IGST (inter-state)</li>
          <li>Add a subject line, notes, and payment terms</li>
          <li>Click <strong>&quot;Save Quote"</strong></li>
        </ul>

        <h4 className="font-semibold text-foreground pt-3">4. Send the Quote</h4>
        <p>Open the quote and click <strong>&quot;Send"</strong>. Your client receives an email with a link. You can also:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Copy the quote link and share it on WhatsApp</li>
          <li>Download as PDF</li>
          <li>Share directly via WhatsApp with one click</li>
        </ul>
      </>
    ),
  },
  {
    id: &quot;quotes",
    icon: FileText,
    title: "Quotes — Complete Guide",
    content: () => (
      <>
        <h4 className="font-semibold text-foreground">Quote Statuses</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gray-400" /> Draft — Not yet sent</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> Sent — Delivered to client</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-purple-500" /> Viewed — Client opened the link</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Approved — Client accepted</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> Changes — Client requested changes</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" /> Expired — Validity period passed</div>
        </div>

        <h4 className="font-semibold text-foreground pt-3">GST Calculation</h4>
        <p>SendQuote automatically calculates GST based on your settings:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Intra-state</strong> (seller and buyer in same state): GST is split as CGST (half) + SGST (half)</li>
          <li><strong>Inter-state</strong> (different states): Full GST as IGST</li>
          <li>Discount is applied <em>before</em> tax calculation (standard Indian practice)</li>
        </ul>

        <h4 className="font-semibold text-foreground pt-3">Quote Numbering</h4>
        <p>Auto-sequential format: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">QTE-2026-0001</code>. Resets per financial year.</p>

        <h4 className="font-semibold text-foreground pt-3">Line Items</h4>
        <p>Each item supports: description, quantity, rate, unit (pcs, hrs, days), and HSN/SAC code. Amount calculates automatically (qty × rate).</p>
      </>
    ),
  },
  {
    id: &quot;invoices",
    icon: IndianRupee,
    title: "Invoices — GST Compliant Billing",
    content: () => (
      <>
        <h4 className="font-semibold text-foreground">How Invoices Work</h4>
        <p>When a client approves a quote, SendQuote automatically generates an invoice. The invoice includes:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>All line items from the approved quote</li>
          <li>CGST + SGST or IGST breakdown</li>
          <li>Unique invoice number in format: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">INV-2026-0001</code></li>
          <li>Balance due and paid amount tracking</li>
        </ul>

        <h4 className="font-semibold text-foreground pt-3">Payment via UPI QR</h4>
        <p>Every invoice PDF includes a UPI QR code. Your client scans it with GPay, PhonePe, or Paytm and pays instantly. Configure your UPI ID in <Link href="/settings" className="text-primary hover:underline">Settings → UPI ID</Link>.</p>

        <h4 className="font-semibold text-foreground pt-3">Invoice Statuses</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> Pending</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> Sent</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Paid</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" /> Overdue</div>
        </div>

        <h4 className="font-semibold text-foreground pt-3">Payment Reminders</h4>
        <p>SendQuote automatically checks for overdue invoices daily. You'll receive email reminders at Day 3, 7, 14, and 30 after the due date. No manual chasing needed.</p>
      </>
    ),
  },
  {
    id: &quot;tracking",
    icon: Eye,
    title: "Client Activity Tracking",
    content: () => (
      <>
        <h4 className="font-semibold text-foreground">Quote View Tracking</h4>
        <p>When your client opens a quote link, SendQuote records:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>View count</strong> — How many times the quote was opened</li>
          <li><strong>First viewed</strong> — Timestamp of first open</li>
          <li><strong>Last viewed</strong> — Timestamp of most recent open</li>
          <li><strong>Device type</strong> — Mobile, tablet, or desktop</li>
        </ul>
        <p>You can see this data on the quote detail page under the <strong>&quot;Activity"</strong> tab. Use this information to follow up at the right moment — when interest is at its peak.</p>

        <h4 className="font-semibold text-foreground pt-3">Email Open Tracking</h4>
        <p>Emails sent via SendQuote include tracking pixels. You'll know when the email was delivered and opened. Subject lines are designed for high open rates:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><code className="text-xs bg-muted px-1.5 py-0.5 rounded">📄 [Business Name] sent you a quotation — ₹XX,XXX</code></li>
          <li><code className="text-xs bg-muted px-1.5 py-0.5 rounded">👁 [Client] just opened your quote — ₹XX,XXX</code></li>
          <li><code className="text-xs bg-muted px-1.5 py-0.5 rounded">✅ [Client] approved your quote! Convert to invoice?</code></li>
        </ul>
      </>
    ),
  },
  {
    id: &quot;whatsapp",
    icon: MessageCircle,
    title: "WhatsApp Sharing",
    content: () => (
      <>
        <h4 className="font-semibold text-foreground">Share on WhatsApp</h4>
        <p>Indian businesses use WhatsApp daily. Every quote and invoice page has a <strong>&quot;Share on WhatsApp"</strong> button. Clicking it opens WhatsApp with a pre-written message:</p>

        <div className="bg-muted/30 rounded-lg p-4 text-xs font-mono leading-relaxed">
          Dear [Client Name],<br />
          <br />
          Please find your quotation from [Business Name].<br />
          <br />
          📄 *[Quote Number]*<br />
          💰 Amount: *₹XX,XXX*<br />
          📅 Valid until: [Date]<br />
          <br />
          🔗 View & Approve Online:<br />
          [Link]
        </div>

        <p className="pt-3">No WhatsApp API needed — this uses the <code className="text-xs bg-muted px-1.5 py-0.5 rounded">wa.me</code> deep link, which works on all phones. No API costs, no setup.</p>

        <h4 className="font-semibold text-foreground pt-3">Invoice & Payment Reminder Messages</h4>
        <p>Similar pre-written templates exist for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Sending an invoice via WhatsApp</li>
          <li>Sending an overdue payment reminder</li>
        </ul>
      </>
    ),
  },
  {
    id: &quot;payments",
    icon: IndianRupee,
    title: "Payments — Razorpay + UPI",
    content: () => (
      <>
        <h4 className="font-semibold text-foreground">UPI QR Code</h4>
        <p>Every invoice PDF includes a UPI QR code. Generated from your <strong>UPI ID</strong> (set in Settings → Business Profile). The QR supports:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Google Pay (GPay)</li>
          <li>PhonePe</li>
          <li>Paytm</li>
          <li>Any UPI-enabled app</li>
        </ul>

        <h4 className="font-semibold text-foreground pt-3">Razorpay Integration</h4>
        <p>Online payments are processed through Razorpay. The workflow:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Invoice is generated with a payment link</li>
          <li>Client clicks &quot;Pay Now" on the invoice page</li>
          <li>Razorpay checkout opens — supports UPI, cards, net banking</li>
          <li>Payment webhook updates the invoice status automatically</li>
        </ol>
        <p>All webhooks are verified using HMAC SHA256 signature — no fake payment notifications are accepted.</p>
      </>
    ),
  },
  {
    id: &quot;profile",
    icon: FileText,
    title: "Business Profile & Settings",
    content: () => (
      <>
        <h4 className="font-semibold text-foreground">Profile Fields</h4>
        <p>Configure your business in <Link href="/settings" className="text-primary hover:underline">Settings → General</Link>:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Business Name</strong> — Appears on every quote and invoice</li>
          <li><strong>Phone</strong> — Contact number for client inquiries</li>
          <li><strong>GST Number</strong> — Validated in real-time for correct format (15 chars)</li>
          <li><strong>UPI ID</strong> — For QR code generation on invoice PDFs</li>
        </ul>

        <h4 className="font-semibold text-foreground pt-3">Plan & Billing</h4>
        <p>Go to <Link href="/settings" className="text-primary hover:underline">Settings → Billing</Link> to view your current plan and upgrade.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Starter (Free)</strong> — 5 quotes/month, basic templates, e-signature</li>
          <li><strong>Growth (₹499/mo)</strong> — Unlimited quotes, AI generation, CRM sync</li>
          <li><strong>Pro (₹999/mo)</strong> — Everything + branded deal rooms, API access</li>
        </ul>
        <p>Annual billing saves ~20%. Upgrade any time — no contracts.</p>
      </>
    ),
  },
  {
    id: &quot;faq",
    icon: FileText,
    title: "Frequently Asked Questions",
    content: () => (
      <>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground">Is SendQuote free?</h4>
            <p>Yes. Starter plan is free with 5 quotes per month. Upgrade when you need more.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Do I need a GST number?</h4>
            <p>No. You can create quotes without a GST number. GST fields are added when you're ready.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Can clients pay via UPI?</h4>
            <p>Yes. Every invoice PDF includes a UPI QR code. Set your UPI ID in Settings.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">What happens when I hit the free plan limit?</h4>
            <p>You'll see a prompt to upgrade. Existing quotes remain accessible. Upgrade in one click from Settings.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Can I cancel anytime?</h4>
            <p>Yes. Cancel from Settings with one click. Your data stays accessible on read-only basis until billing period ends.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">How do I contact support?</h4>
            <p>Email: <a href="mailto:support@sendquote.in" className="text-primary hover:underline">support@sendquote.in</a> — we reply within 4 hours on business days.</p>
          </div>
        </div>
      </>
    ),
  },
];

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Documentation</h1>
          <p className="mt-2 text-muted-foreground">
            Everything you need to know about using SendQuote.
          </p>

          <div className="mt-10 space-y-3">
            {sections.map((section) => (
              <ExpandableSection key={section.id} icon={section.icon} title={section.title}>
                <section.content />
              </ExpandableSection>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
