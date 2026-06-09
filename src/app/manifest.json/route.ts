import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    name: "SendQuote — AI-Powered Quoting for Indian Businesses",
    short_name: "SendQuote",
    description: "Create GST-ready quotes in 60 seconds with AI. Send interactive deal rooms, collect e-signatures, and close deals faster.",
    start_url: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    background_color: "#0A0A0A",
    theme_color: "#00D4AA",
    orientation: "portrait-primary",
    categories: ["business", "productivity", "finance"],
    screenshots: [
      { src: "/og-image.webp", sizes: "1200x630", type: "image/webp", form_factor: "wide", label: "SendQuote Dashboard" },
    ],
    icons: [
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/icon-192.webp", sizes: "96x96", type: "image/webp" },
      { src: "/icon-192.webp", sizes: "192x192", type: "image/webp" },
      { src: "/icon-512.webp", sizes: "512x512", type: "image/webp" },
    ],
    shortcuts: [
      { name: "New Quote", url: "/quotes/new", icons: [{ src: "/icon-96.webp", sizes: "96x96" }] },
      { name: "Dashboard", url: "/dashboard", icons: [{ src: "/icon-96.webp", sizes: "96x96" }] },
    ],
  });
}
