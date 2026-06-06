import { NextResponse } from "next/server";

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>SendQuote</ShortName>
  <Description>Search SendQuote documentation and help</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Url type="text/html" method="get" template="https://sendquote.in/dashboard?q={searchTerms}"/>
  <Url type="application/opensearchdescription+xml" rel="self" template="https://sendquote.in/opensearch.xml"/>
</OpenSearchDescription>`;
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/opensearchdescription+xml" },
  });
}
