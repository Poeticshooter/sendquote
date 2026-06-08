import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DealRoomClient } from "@/components/deal-room/deal-room-client";
import { PublicQuoteView } from "@/components/deal-room/public-quote-view";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("quote_number, client_name, total")
    .eq("public_token", token)
    .single();

  if (!quote) return { title: "Quote Not Found" };

  return {
    title: `Quote ${quote.quote_number} for ${quote.client_name} | SendQuote`,
    description: `View quote ${quote.quote_number} for ₹${Number(quote.total).toLocaleString("en-IN")}`,
    openGraph: {
      title: `Quote ${quote.quote_number} | SendQuote`,
      description: `View your quote from ${quote.client_name}`,
    },
  };
}

export default async function PublicQuotePage({ params }: Props) {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("*, quote_items(*)")
    .eq("public_token", token)
    .single();

  if (!quote) notFound();

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <PublicQuoteView quote={quote} publicToken={token} />
      </div>
      <DealRoomClient
        quoteId={quote.id}
        publicToken={token}
        quoteNumber={quote.quote_number}
        clientName={quote.client_name}
      />
    </div>
  );
}
