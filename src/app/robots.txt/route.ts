export async function GET() {
  const content = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Allow: /dashboard$

Sitemap: https://sendquote.in/sitemap.xml`;
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
