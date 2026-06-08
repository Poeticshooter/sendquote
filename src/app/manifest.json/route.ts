import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "SendQuote — AI-Powered Quoting for Indian Businesses",
    short_name: "SendQuote",
    description: "Create GST-ready quotes in 60 seconds with AI. Send interactive deal rooms, collect e-signatures, and close deals faster.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#00D4AA",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/logo-icon.svg", sizes: "96x96", type: "image/svg+xml" },
    ],
  });
}
