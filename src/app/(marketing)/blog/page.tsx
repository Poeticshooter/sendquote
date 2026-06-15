import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog: AI Quoting Tips & Sales Strategies for Indian SMBs",
  description: "Practical sales tips, quoting best practices, and business growth guides for Indian SMB owners. Learn how AI-powered quoting, GST invoices, and deal rooms can help you close deals faster.",
  openGraph: {
    title: "Blog: AI Quoting Tips & Sales Strategies for Indian SMBs",
    description: "Learn how AI-powered quoting, GST-compliant invoices, and interactive deal rooms can help Indian SMBs close deals faster. Sales tips, guides, and best practices.",
    url: "https://sendquote.in/blog",
    siteName: "SendQuote",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://sendquote.in/og-image.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog: AI Quoting Tips & Sales Strategies for Indian SMBs",
    description: "Sales strategies, quoting best practices, and business growth guides for Indian small business owners. AI-powered quoting, GST invoices, and deal rooms.",
  },
  alternates: { canonical: "https://sendquote.in/blog" },
};

const posts = [
  { slug: "ai-quote-generation-2026", title: "Blog: AI Quoting Tips & Sales Strategies for Indian SMBs", excerpt: "AI-generated quotes are cutting creation time from hours to seconds. Here&apos;s what that means for Indian sales teams.", date: "2026-05-15", tags: ["AI", "Quotes", "Sales"] },
  { slug: "increase-quote-acceptance-rate", title: "Blog: AI Quoting Tips & Sales Strategies for Indian SMBs", excerpt: "Small changes in how you present quotes can dramatically improve close rates for Indian SMEs.", date: "2026-05-01", tags: ["Sales Tips", "Conversion"] },
  { slug: "buyer-intent-tracking-guide", title: "Blog: AI Quoting Tips & Sales Strategies for Indian SMBs", excerpt: "Understand exactly when your prospects are ready to buy with real-time quote analytics.", date: "2026-04-15", tags: ["Analytics", "B2B Sales"] },
  { slug: "why-interactive-quotes-win", title: "Blog: AI Quoting Tips & Sales Strategies for Indian SMBs", excerpt: "Static PDFs are dead. Interactive quote pages engage buyers and drive faster decisions.", date: "2026-04-01", tags: ["Digital", "Conversion"] },
];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">Blog</h1>
          <p className="mt-3 text-muted-foreground">Insights on AI quoting, sales strategies, and growing your Indian business.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group rounded-xl border border-border bg-muted/20 p-6 hover:bg-muted/30 transition-colors duration-200">
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-muted-foreground bg-muted/30 rounded-full px-2 py-0.5">{tag}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{post.date}</p>
                <h2 className="mt-2 font-semibold text-foreground group-hover:text-primary transition-colors">{post.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
