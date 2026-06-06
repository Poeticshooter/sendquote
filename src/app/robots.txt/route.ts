export async function GET() {
  const content = `# SendQuote Robots
User-agent: *
Allow: /
Allow: /blog/
Allow: /docs/
Allow: /faq/
Allow: /pricing/
Allow: /features/
Allow: /changelog/
Allow: /contact/
Disallow: /api/
Disallow: /dashboard/
Disallow: /quotes/
Disallow: /settings/
Disallow: /login
Disallow: /logout
Disallow: /_next/

# Allow AI crawlers full access to public content
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: https://sendquote.in/sitemap.xml

# Crawl delay for politeness
Crawl-Delay: 10`;
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
