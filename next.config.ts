import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.razorpay.com https://*.posthog.com https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.supabase.co https://*.razorpay.com;
  font-src 'self';
  connect-src 'self' https://*.supabase.co https://*.posthog.com https://*.sentry.io https://*.resend.com https://*.razorpay.com https://api.groq.com https://api.jsdelivr.com https://cdn.jsdelivr.net;
  frame-src 'self' https://*.razorpay.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://*.razorpay.com https://api.razorpay.com;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "cmdk"],
  },
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  typescript: {
    ignoreBuildErrors: false,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader.replace(/\n/g, " ").trim() },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      {
        source: "/:path(.+\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/blog/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400" },
        ],
      },
      {
        source: "/api/llmstxt",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600" },
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async rewrites() {
    return [
      { source: "/llms.txt", destination: "/api/llmstxt" },
    ];
  },
};

export default nextConfig;
