import type { MetadataRoute } from "next";

const base = "https://sendquote.in";
const now = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const core: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/features`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/docs`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  const blogPosts: MetadataRoute.Sitemap = [
    { slug: "ai-quote-generation-2026", date: "2026-05-15" },
    { slug: "increase-quote-acceptance-rate", date: "2026-05-01" },
    { slug: "buyer-intent-tracking-guide", date: "2026-04-15" },
    { slug: "why-interactive-quotes-win", date: "2026-04-01" },
  ].map(({ slug, date }) => ({
    url: `${base}/blog/${slug}`,
    lastModified: new Date(date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const featurePages: MetadataRoute.Sitemap = [
    "ai-quote-generation", "interactive-deal-room", "buyer-tracking", "e-signature",
    "approval-workflows", "crm-integration", "client-portal", "deal-room",
    "quote-templates", "payment-collection", "team-collaboration", "analytics",
  ].map((slug) => ({
    url: `${base}/features/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const industryPages: MetadataRoute.Sitemap = [
    "agencies", "consultants", "software-companies", "marketing-firms",
    "it-services", "manufacturing", "saas-companies", "freelancers",
    "real-estate", "healthcare", "education", "ecommerce",
  ].map((slug) => ({
    url: `${base}/industry/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const comparisonPages: MetadataRoute.Sitemap = [
    "sendquote-vs-freshbooks", "sendquote-vs-zoho-invoice", "sendquote-vs-billdu",
    "sendquote-vs-invoice-owl", "sendquote-vs-pandadoc",
  ].map((slug) => ({
    url: `${base}/comparisons/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...core, ...blogPosts, ...featurePages, ...industryPages, ...comparisonPages];
}
