import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "SendQuote",
    short_name: "SendQuote",
    description: "AI-powered revenue workflow platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a1a1a",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  });
}
