import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — SendQuote",
  description: "AI quoting tips, sales strategies, and business growth insights for Indian businesses.",
  openGraph: { title: "Blog | SendQuote" },
};

const posts = [
  { slug: "ai-quote-generation-2026", title: "AI Quote Generation: How Indian Businesses Are Closing Deals 5x Faster in 2026", excerpt: "AI-generated quotes are cutting creation time from hours to seconds. Here's what that means for Indian sales teams.", date: "2026-05-15", tags: ["AI", "Quotes", "Sales"] },
  { slug: "increase-quote-acceptance-rate", title: "10 Proven Ways to Increase Your Quote Acceptance Rate", excerpt: "Small changes in how you present quotes can dramatically improve close rates for Indian SMEs.", date: "2026-05-01", tags: ["Sales Tips", "Conversion"] },
  { slug: "buyer-intent-tracking-guide", title: "Buyer Intent Tracking for B2B Sales: Complete Guide 2026", excerpt: "Understand exactly when your prospects are ready to buy with real-time quote analytics.", date: "2026-04-15", tags: ["Analytics", "B2B Sales"] },
  { slug: "why-interactive-quotes-win", title: "Why Interactive Quotes Close 3x Faster Than PDFs", excerpt: "Static PDFs are dead. Interactive quote pages engage buyers and drive faster decisions.", date: "2026-04-01", tags: ["Digital", "Conversion"] },
];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">Blog</h1>
          <p className="mt-3 text-white/40">Insights on AI quoting, sales strategies, and growing your Indian business.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all">
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-white/40 bg-white/5 rounded-full px-2 py-0.5">{tag}</span>
                  ))}
                </div>
                <p className="text-xs text-white/30">{post.date}</p>
                <h2 className="mt-2 font-semibold text-white group-hover:text-[#00D4AA] transition-colors">{post.title}</h2>
                <p className="mt-2 text-sm text-white/40 line-clamp-2">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
