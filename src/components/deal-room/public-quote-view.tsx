"use client";

import { useState } from "react";
import Image from "next/image";
import { SignQuoteFlow } from "./sign-quote-flow";
import { ExpiryCountdown } from "./expiry-countdown";
import { CheckCircle } from "lucide-react";

interface PublicQuoteItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface PublicQuoteData {
  quote_number: string;
  client_name: string;
  status: string;
  valid_until: string | null;
  quote_items: PublicQuoteItem[] | null;
  subtotal: number;
  gst_rate: string | number;
  gst_amount: string | number;
  total: string | number;
  notes: string | null;
  terms: string | null;
}

interface PublicQuoteViewProps {
  quote: PublicQuoteData;
  publicToken: string;
}

export function PublicQuoteView({ quote, publicToken }: PublicQuoteViewProps) {
  const [signed, setSigned] = useState(quote.status === "accepted");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-icon.svg" alt="SendQuote" width={36} height={36} className="h-[60px] w-[60px]" />
            <span className="text-xl font-bold text-foreground">SendQuote</span>
          </div>
          <span className="text-sm text-muted-foreground font-mono">{quote.quote_number}</span>
        </div>

        <div className="py-6">
          <h1 className="text-2xl font-bold text-foreground">Quote for {quote.client_name}</h1>
          <p className="text-muted-foreground mt-1">Review the details below.</p>
          <div className="mt-3">
            <ExpiryCountdown validUntil={quote.valid_until} />
          </div>
        </div>

        {signed && (
          <div className="mb-6 rounded-lg bg-[#00D4AA]/10 border border-[#00D4AA]/20 p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-primary font-medium">This quote has been accepted.</p>
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-3 font-medium">Description</th>
              <th className="pb-3 font-medium text-right">Qty</th>
              <th className="pb-3 font-medium text-right">Rate</th>
              <th className="pb-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quote.quote_items?.map((item: PublicQuoteItem) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-3 text-foreground/80">{item.description}</td>
                <td className="py-3 text-right text-muted-foreground">{item.quantity}</td>
                <td className="py-3 text-right text-muted-foreground">₹{Number(item.rate).toLocaleString("en-IN")}</td>
                <td className="py-3 text-right text-foreground font-medium">₹{Number(item.amount).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 space-y-1 text-right text-sm">
          <p className="text-muted-foreground">Subtotal: <span className="font-medium text-foreground">₹{Number(quote.subtotal).toLocaleString("en-IN")}</span></p>
          {Number(quote.gst_rate) > 0 && (
            <p className="text-muted-foreground">GST ({quote.gst_rate}%): <span className="font-medium text-foreground">₹{Number(quote.gst_amount).toLocaleString("en-IN")}</span></p>
          )}
          <p className="text-xl font-bold text-primary border-t border-border pt-2 mt-2">
            Total: ₹{Number(quote.total).toLocaleString("en-IN")}
          </p>
        </div>

        {quote.notes && (
          <div className="mt-6 border-t border-border pt-4">
            <h3 className="font-medium text-foreground mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}
        {quote.terms && (
          <div className="mt-4 border-t border-border pt-4">
            <h3 className="font-medium text-foreground mb-2">Terms</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.terms}</p>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          {signed ? (
            <div className="text-center text-primary">
              <CheckCircle className="mx-auto h-8 w-8 mb-2" />
              <p className="font-medium">Quote Accepted</p>
            </div>
          ) : (
            <SignQuoteFlow publicToken={publicToken} quoteNumber={quote.quote_number} total={Number(quote.total)} onSigned={() => setSigned(true)} />
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Powered by <span className="font-semibold text-foreground/50">SendQuote</span></p>
      </div>
    </div>
  );
}
