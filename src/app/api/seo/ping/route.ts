import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const fullUrl = url.startsWith("http") ? url : `https://sendquote.in${url.startsWith("/") ? url : `/${url}`}`;

    const results: Record<string, any> = {};

    // IndexNow (Bing + Yandex)
    const indexNowKey = "sendquote-in-indexnow";
    const indexNowPayload = {
      host: "sendquote.in",
      key: indexNowKey,
      keyLocation: `https://sendquote.in/${indexNowKey}.txt`,
      urlList: [fullUrl],
    };

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

    // Google Indexing API via sitemap ping
    try {
      const googleUrl = `https://www.google.com/ping?sitemap=https://sendquote.in/sitemap.xml`;
      const gRes = await fetch(googleUrl);
      results.google = { status: gRes.status };
    } catch {
      results.google = { error: "Google ping unavailable" };
    }

    // Bing webmaster
    try {
      const bingUrl = `https://www.bing.com/ping?sitemap=https://sendquote.in/sitemap.xml`;
      const bRes = await fetch(bingUrl);
      results.bing = { status: bRes.status };
    } catch {
      results.bing = { error: "Bing ping unavailable" };
    }

    return NextResponse.json({ success: true, url: fullUrl, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
