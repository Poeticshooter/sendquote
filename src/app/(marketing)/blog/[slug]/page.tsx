import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

const posts: Record<string, { title: string; date: string; author: string; body: string; tags: string[] }> = {
  "ai-quote-generation-2026": {
    title: "AI Quote Generation: How Indian Businesses Are Closing Deals 5x Faster in 2026",
    date: "2026-05-15",
    author: "SendQuote Team",
    tags: ["AI quotes", "quote generation", "sales automation", "Indian business"],
    body: `AI-powered quote generation is transforming how Indian businesses create and send proposals. Instead of spending hours manually crafting quotes, sales teams can now generate complete, professional quotations from a brief description in under 60 seconds.

## Why AI Quote Generation Matters for Indian Businesses

For Indian SMEs and service providers, time is money. Creating quotes manually means:
- **Hours lost** to formatting and pricing calculations
- **Inconsistent pricing** across different quotes
- **Missed upsell opportunities** that AI can identify
- **Delayed responses** that lose deals to competitors

## How SendQuote's AI Works

SendQuote's AI engine analyzes your product catalog, past successful quotes, and industry benchmarks to generate optimized pricing. Simply describe what you're quoting — "Website redesign for a dental clinic with 5 pages" — and the AI creates complete line items, pricing, and terms.

## Real Results

Businesses using AI quote generation report:
- **75% faster** quote creation time
- **35% higher** win rates
- **40% more** upsell opportunities identified
- **GST-ready invoices** generated automatically

## Getting Started with AI Quotes

Ready to transform your quoting process? [Start your free trial](/signup) and see how SendQuote's AI can help you close deals faster.`,
  },
  "increase-quote-acceptance-rate": {
    title: "10 Proven Ways to Increase Your Quote Acceptance Rate (2026 Guide)",
    date: "2026-05-01",
    author: "SendQuote Team",
    tags: ["quote acceptance", "sales tips", "closing deals", "Indian SMEs"],
    body: `Your quote acceptance rate is the single most important metric for revenue growth. Here are 10 proven strategies to improve it, specifically for Indian businesses.

## 1. Send Interactive Quotes Instead of PDFs
Static PDFs have 3x lower engagement than interactive quote pages. SendQuote's Deal Room turns every quote into a branded micro-site that clients can explore, chat about, and accept — all in one place.

## 2. Use AI-Generated Pricing
AI analyzes your win/loss data to suggest optimal pricing. SendQuote's AI pricing optimizer helps you find the sweet spot between competitive pricing and profitability.

## 3. Enable In-Quote Negotiation
Let clients request changes and counter-offer directly inside the quote. No more email ping-pong. SendQuote's negotiation feature handles this seamlessly.

## 4. Add Social Proof
Include testimonials and case studies in your quotes. SendQuote's content blocks make this easy with drag-and-drop templates.

## 5. Set Clear Expiry Dates
Urgency drives action. SendQuote automatically adds countdown timers to quotes, creating healthy closing pressure.

## 6. Track Buyer Intent
Know exactly when your prospect is most interested. SendQuote tracks section-level engagement — when they spend time on pricing, it&apos;s time to call.

## 7. Send Personalized Follow-Ups
AI-drafted follow-up emails triggered by buyer behavior recover 20%+ of "ghosted" quotes.

## 8. Offer Multiple Payment Options
GST-ready invoices with UPI, card, and net banking options remove payment friction.

## 9. Use Video Introductions
Add a short video to your quote. SendQuote supports video embeds directly in the Deal Room.

## 10. Follow Up Within 24 Hours
Timing matters. SendQuote's auto-follow-up engine sends personalized messages when buyer engagement peaks.`,
  },
  "buyer-intent-tracking-guide": {
    title: "Buyer Intent Tracking for B2B Sales: Complete Guide 2026",
    date: "2026-04-15",
    author: "SendQuote Team",
    tags: ["buyer intent", "sales tracking", "B2B sales", "quote analytics"],
    body: `Buyer intent tracking tells you exactly when your prospects are ready to buy. By monitoring how they interact with your quote, you can time your follow-ups perfectly.

## What is Buyer Intent?

Buyer intent refers to the signals a prospect sends when they&apos;re actively considering a purchase. In the context of quoting, these signals include:
- Multiple views of the pricing section
- Returning to the quote after initial review
- Sharing the quote link with colleagues
- Spending time on specific line items
- Using the chat feature to ask questions

## Why Indian Businesses Need Buyer Intent Tracking

In India's competitive B2B landscape, timing is everything. Being the first to follow up when a prospect is actively reviewing your quote can be the difference between winning and losing a deal.

## How SendQuote Tracks Intent

SendQuote's Deal Room tracks every interaction automatically:
- **Page views** — How many times the quote was opened
- **Section engagement** — Which parts of the quote were viewed most
- **Time spent** — How long was spent on each section
- **Device type** — Desktop, mobile, or tablet
- **Location** — Where the viewer is located
- **Chat activity** — Questions asked during review

## Using Intent Data to Close Deals

When your prospect views the pricing section three times in one day, SendQuote sends you an alert. This is your signal to call them immediately while interest is at its peak.

Sales teams using intent tracking close 40% more deals by reaching out at the exact moment of maximum interest.`,
  },
  "why-interactive-quotes-win": {
    title: "Why Interactive Quotes Close 3x Faster Than PDFs",
    date: "2026-04-01",
    author: "SendQuote Team",
    tags: ["interactive quotes", "digital proposals", "sales conversion", "Indian businesses"],
    body: `Static PDF quotes have a fundamental problem: they&apos;re passive. Your prospect reads, sets it aside, and has to take multiple steps to act. Each step is a drop-off point.

## The Problem with PDF Quotes

PDFs force your prospect to:
1. Download the file
2. Find it later
3. Print it (often)
4. Sign it manually
5. Scan it back
6. Email it back

That's six opportunities to abandon the process.

## How Interactive Quotes Work

SendQuote's Deal Room transforms the quoting experience:
- **One click to open** — No download required
- **Instant e-signature** — Sign with a finger or mouse
- **Real-time chat** — Ask questions without leaving the page
- **Live negotiation** — Adjust quantities and see prices update instantly
- **Auto-generated invoice** — GST-ready invoice created on acceptance

## The Numbers Don't Lie

Interactive quotes achieve:
- **3x higher** engagement rates
- **3x faster** close times
- **40% higher** acceptance rates
- **75% reduction** in quote-to-close time

## Perfect for Indian Businesses

Interactive quotes are especially powerful for Indian businesses that frequently share quotes via WhatsApp. SendQuote's Deal Room works perfectly on mobile — clients can review, negotiate, and accept quotes right from their phone.

Ready to transform your quoting? [Try SendQuote free](/signup).`,
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.body.slice(0, 160),
    keywords: post.tags,
    openGraph: { title: post.title, description: post.body.slice(0, 160), type: "article", publishedTime: post.date },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    author: { "@type": "Organization", name: "SendQuote" },
    datePublished: post.date,
    description: post.body.slice(0, 160),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Navbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-2xl">
          <Link href="/blog" className="text-sm text-primary hover:underline">&larr; Back to Blog</Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl text-foreground">{post.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground bg-muted/30 rounded-full px-2.5 py-0.5">{tag}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{post.date} · {post.author}</p>
          <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground">
            {post.body.split("\n\n").map((p, i) => {
              if (p.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-4">{p.replace("## ", "")}</h2>;
              if (p.startsWith("- **")) {
                const items = p.split("\n").filter(l => l.startsWith("- **"));
                return <ul key={i} className="space-y-2 my-4">{items.map((item, j) => <li key={j} className="flex items-start gap-2"><span className="text-primary mt-1.5">•</span><span>{item.replace(/^- \*\*|\*\*/g, "")}</span></li>)}</ul>;
              }
              return <p key={i}>{p}</p>;
            })}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
