import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

const posts = {
  "ai-quote-generation-2026": {
    title: "How AI Quote Generation is Transforming Sales in 2026",
    date: "2026-05-15",
    author: "SendQuote Team",
    body: "AI-generated quotes are revolutionizing the sales process. Instead of spending hours manually crafting proposals, sales reps can now generate complete, professional quotes from a brief description in under 60 seconds.\n\nThis isn't just about speed — it's about consistency. AI ensures every quote follows best practices, includes relevant upsells, and prices competitively based on historical win data.\n\nSendQuote's AI engine analyzes your product catalog, past successful quotes, and industry benchmarks to generate pricing that wins deals. It also detects potential risks like underpricing or scope gaps before you send.\n\nThe result? Sales teams using AI quote generation report 35% higher win rates and 75% faster quote-to-close times.",
  },
  "increase-quote-acceptance-rate": {
    title: "10 Ways to Increase Your Quote Acceptance Rate",
    date: "2026-05-01",
    author: "SendQuote Team",
    body: "Your quote acceptance rate is the single most important metric for revenue growth. Here are 10 proven strategies to improve it:\n\n1. Send interactive quotes instead of PDFs (3x higher engagement)\n2. Include video introductions (40% higher close rate)\n3. Offer multiple pricing tiers\n4. Add social proof (testimonials, case studies)\n5. Use countdown timers for urgency\n6. Enable in-quote negotiation\n7. Follow up within 24 hours of sending\n8. Track buyer intent and time your follow-ups\n9. Offer one-click payment options\n10. Send personalized follow-ups based on behavior\n\nSendQuote makes all of these strategies easy with interactive deal rooms, buyer tracking, and AI-powered follow-ups.",
  },
  "buyer-intent-tracking-guide": {
    title: "The Complete Guide to Buyer Intent Tracking",
    date: "2026-04-15",
    author: "SendQuote Team",
    body: "Buyer intent tracking tells you exactly when your prospects are ready to buy. By monitoring how they interact with your quote, you can time your follow-ups perfectly.\n\nKey signals to watch:\n- Multiple views of the pricing section\n- Returning to the quote after initial review\n- Sharing the quote link with colleagues\n- Spending time on specific line items\n- Using the chat feature to ask questions\n\nSendQuote's Deal Room tracks all of these signals automatically. When your prospect views the pricing section three times in one day, you get an alert to call them immediately.\n\nThe result? Reps who use intent tracking close 40% more deals by reaching out at the exact moment of maximum interest.",
  },
  "why-interactive-quotes-win": {
    title: "Why Interactive Quotes Close 3x Faster Than PDFs",
    date: "2026-04-01",
    author: "SendQuote Team",
    body: "Static PDF quotes have a fundamental problem: they're passive. Your prospect reads, sets it aside, and has to take multiple steps to act. Each step is a drop-off point.\n\nInteractive quotes solve this by turning the quote into a buying experience. Instead of a document, it's a micro-site where prospects can:\n- Click to accept specific line items\n- Adjust quantities and see prices update live\n- Ask questions via built-in chat\n- Sign and pay with one click\n\nThe numbers don't lie: interactive quotes have 3x higher engagement rates and close 3x faster than traditional PDF quotes. They also provide valuable data on what your prospect is most interested in.\n\nWith SendQuote, every quote is an interactive deal room — no PDF required.",
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug as keyof typeof posts];
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.body.slice(0, 160),
    openGraph: { title: post.title, description: post.body.slice(0, 160), type: "article", publishedTime: post.date },
    twitter: { card: "summary_large_image", title: post.title },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = posts[slug as keyof typeof posts];
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
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Blog</Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{post.date} · {post.author}</p>
          <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground">
            {post.body.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
