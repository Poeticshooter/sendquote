import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/quote/', '/invoice/', '/settings', '/upgrade', '/invoices/', '/q/', '/auth/', '/admin/'],
      },
    ],
    sitemap: 'https://sendquote.in/sitemap.xml',
  }
}