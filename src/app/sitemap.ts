import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://sendquote.in";

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/signup`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/docs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/changelog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  const industryPages: MetadataRoute.Sitemap = [
    "agencies", "consultants", "software-companies", "marketing-firms",
    "it-services", "manufacturing", "saas-companies", "freelancers",
  ].map((slug) => ({
    url: `${base}/industry/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const featurePages: MetadataRoute.Sitemap = [
    "ai-quote-generation", "interactive-deal-room", "buyer-tracking",
    "e-signature", "payment-collection", "approval-workflows",
    "crm-integration", "client-portal",
  ].map((slug) => ({
    url: `${base}/features/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...industryPages, ...featurePages];
}
