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
      { src: "/og-image.svg", sizes: "1200x630", type: "image/svg+xml", form_factor: "wide", label: "SendQuote Dashboard" },
    ],
    icons: [
      { src: "/favicon-v2.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/logo-icon-v2.svg", sizes: "96x96", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "New Quote", url: "/quotes/new", icons: [{ src: "/favicon-v2.svg", sizes: "any" }] },
      { name: "Dashboard", url: "/dashboard", icons: [{ src: "/favicon-v2.svg", sizes: "any" }] },
    ],
  });
}
