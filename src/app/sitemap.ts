import type { MetadataRoute } from "next";

const base = "https://sendquote.in";
const now = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const core: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/features`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/docs`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  const comparisons: MetadataRoute.Sitemap = [
    { url: `${base}/comparisons`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/comparisons/vs-pandadoc`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/comparisons/vs-proposify`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/comparisons/vs-qwilr`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/comparisons/vs-better-proposals`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  return [...core, ...comparisons];
}
