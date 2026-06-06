import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — SendQuote",
  description: "Insights on quoting, sales workflows, AI in business, and tips for closing more deals.",
  openGraph: { title: "Blog | SendQuote" },
};

const posts = [
  { slug: "ai-quote-generation-2026", title: "How AI Quote Generation is Transforming Sales in 2026", excerpt: "AI-generated quotes are cutting creation time from hours to seconds. Here's what that means for your sales team.", date: "2026-05-15", author: "SendQuote Team" },
  { slug: "increase-quote-acceptance-rate", title: "10 Ways to Increase Your Quote Acceptance Rate", excerpt: "Small changes in how you present quotes can dramatically improve close rates.", date: "2026-05-01", author: "SendQuote Team" },
  { slug: "buyer-intent-tracking-guide", title: "The Complete Guide to Buyer Intent Tracking", excerpt: "Understand exactly when your prospects are ready to buy with real-time quote analytics.", date: "2026-04-15", author: "SendQuote Team" },
  { slug: "why-interactive-quotes-win", title: "Why Interactive Quotes Close 3x Faster Than PDFs", excerpt: "Static PDFs are dead. Interactive quote pages engage buyers and drive faster decisions.", date: "2026-04-01", author: "SendQuote Team" },
];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
          <p className="mt-3 text-muted-foreground">Insights on quoting, AI, and closing more deals.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group rounded-xl border bg-card p-6 hover:shadow-md transition-shadow">
                <p className="text-xs text-muted-foreground">{post.date}</p>
                <h2 className="mt-2 font-semibold group-hover:text-foreground/80 transition-colors">{post.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                <p className="mt-3 text-xs text-muted-foreground">{post.author}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
