"use client";

import { useState } from "react";
import { SignQuoteFlow } from "./sign-quote-flow";
import { ExpiryCountdown } from "./expiry-countdown";
import { CheckCircle } from "lucide-react";

interface PublicQuoteViewProps {
  quote: any;
  publicToken: string;
}

export function PublicQuoteView({ quote, publicToken }: PublicQuoteViewProps) {
  const [signed, setSigned] = useState(quote.status === "accepted");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo-icon.svg" alt="SendQuote" className="h-10 w-10" />
            <span className="text-xl font-bold text-white">SendQuote</span>
          </div>
          <span className="text-sm text-white/40 font-mono">{quote.quote_number}</span>
        </div>

        <div className="py-6">
          <h1 className="text-2xl font-bold text-white">Quote for {quote.client_name}</h1>
          <p className="text-white/40 mt-1">Review the details below.</p>
          <div className="mt-3">
            <ExpiryCountdown validUntil={quote.valid_until} />
          </div>
        </div>

        {signed && (
          <div className="mb-6 rounded-lg bg-[#00D4AA]/10 border border-[#00D4AA]/20 p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-[#00D4AA] shrink-0" />
            <p className="text-sm text-[#00D4AA] font-medium">This quote has been accepted.</p>
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-white/40">
              <th className="pb-3 font-medium">Description</th>
              <th className="pb-3 font-medium text-right">Qty</th>
              <th className="pb-3 font-medium text-right">Rate</th>
              <th className="pb-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(quote as any).quote_items?.map((item: any) => (
              <tr key={item.id} className="border-b border-white/[0.06]">
                <td className="py-3 text-white/80">{item.description}</td>
                <td className="py-3 text-right text-white/60">{item.quantity}</td>
                <td className="py-3 text-right text-white/60">₹{Number(item.rate).toLocaleString("en-IN")}</td>
                <td className="py-3 text-right text-white font-medium">₹{Number(item.amount).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 space-y-1 text-right text-sm">
          <p className="text-white/60">Subtotal: <span className="font-medium text-white">₹{Number(quote.subtotal).toLocaleString("en-IN")}</span></p>
          {Number(quote.gst_rate) > 0 && (
            <p className="text-white/60">GST ({quote.gst_rate}%): <span className="font-medium text-white">₹{Number(quote.gst_amount).toLocaleString("en-IN")}</span></p>
          )}
          <p className="text-xl font-bold text-[#00D4AA] border-t border-white/[0.06] pt-2 mt-2">
            Total: ₹{Number(quote.total).toLocaleString("en-IN")}
          </p>
        </div>

        {quote.notes && (
          <div className="mt-6 border-t border-white/[0.06] pt-4">
            <h3 className="font-medium text-white mb-2">Notes</h3>
            <p className="text-sm text-white/60 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}
        {quote.terms && (
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <h3 className="font-medium text-white mb-2">Terms</h3>
            <p className="text-sm text-white/60 whitespace-pre-wrap">{quote.terms}</p>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          {signed ? (
            <div className="text-center text-[#00D4AA]">
              <CheckCircle className="mx-auto h-8 w-8 mb-2" />
              <p className="font-medium">Quote Accepted</p>
            </div>
          ) : (
            <SignQuoteFlow publicToken={publicToken} quoteNumber={quote.quote_number} total={Number(quote.total)} onSigned={() => setSigned(true)} />
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm text-white/30">Powered by <span className="font-semibold text-white/50">SendQuote</span></p>
      </div>
    </div>
  );
}
