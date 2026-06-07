import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://sendquote.in";

  const core: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${base}/docs`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/changelog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.1 },
    { url: `${base}/signup`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  const blog: MetadataRoute.Sitemap = [
    "ai-quote-generation-2026", "increase-quote-acceptance-rate", "buyer-intent-tracking-guide", "why-interactive-quotes-win",
  ].map((slug) => ({
    url: `${base}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const features: MetadataRoute.Sitemap = [
    "ai-quote-generation", "interactive-deal-room", "buyer-tracking", "e-signature",
    "e-signature", "approval-workflows", "crm-integration", "client-portal",
  ].map((slug) => ({
    url: `${base}/features/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const industries: MetadataRoute.Sitemap = [
    "agencies", "consultants", "software-companies", "marketing-firms",
    "it-services", "manufacturing", "saas-companies", "freelancers",
  ].map((slug) => ({
    url: `${base}/industry/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...core, ...blog, ...features, ...industries];
}
