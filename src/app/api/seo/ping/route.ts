import { NextResponse } from "next/server";
import { z } from "zod";
import { parseError } from "@/lib/api-helper";

const SeoPingSchema = z.object({
  url: z.string().min(1, "URL is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = SeoPingSchema.parse(body);

    const fullUrl = url.startsWith("http") ? url : `https://sendquote.in${url.startsWith("/") ? url : `/${url}`}`;

    const indexNowKey = process.env.INDEXNOW_KEY || "sendquote-in-indexnow";
    const indexNowPayload = {
      host: "sendquote.in",
      key: indexNowKey,
      keyLocation: `https://sendquote.in/${indexNowKey}.txt`,
      urlList: [fullUrl],
    };

    const results: Record<string, unknown> = {};

    try {
      const idxRes = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(indexNowPayload),
      });
      results.indexNow = { status: idxRes.status };
    } catch {
      results.indexNow = { error: "IndexNow unavailable" };
    }

    try {
      const googleUrl = `https://www.google.com/ping?sitemap=https://sendquote.in/sitemap.xml`;
      const gRes = await fetch(googleUrl);
      results.google = { status: gRes.status };
    } catch {
      results.google = { error: "Google ping unavailable" };
    }

    try {
      const bingUrl = `https://www.bing.com/ping?sitemap=https://sendquote.in/sitemap.xml`;
      const bRes = await fetch(bingUrl);
      results.bing = { status: bRes.status };
    } catch {
      results.bing = { error: "Bing ping unavailable" };
    }

    return NextResponse.json({ success: true, url: fullUrl, results });
  } catch (e) {
    return parseError(e);
  }
}
