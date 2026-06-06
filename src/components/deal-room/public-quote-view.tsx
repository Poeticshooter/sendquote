"use client";

import { useState } from "react";
import { AcceptPayFlow } from "./accept-pay-flow";
import { ExpiryCountdown } from "./expiry-countdown";
import { CheckCircle } from "lucide-react";

interface PublicQuoteViewProps {
  quote: any;
  publicToken: string;
}

export function PublicQuoteView({ quote, publicToken }: PublicQuoteViewProps) {
  const [accepted, setAccepted] = useState(quote.status === "accepted" || quote.status === "paid");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b pb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              SQ
            </div>
            <span className="text-xl font-bold">SendQuote</span>
          </div>
          <span className="text-sm text-gray-500">{quote.quote_number}</span>
        </div>

          <div className="py-6">
            <h1 className="text-2xl font-bold">Quote for {quote.client_name}</h1>
            <p className="text-gray-500 mt-1">Review the details below. Questions? Use the chat!</p>
            <div className="mt-3">
              <ExpiryCountdown validUntil={quote.valid_until} />
            </div>
          </div>

        {accepted && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 font-medium">This quote has been accepted.</p>
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 font-medium">Description</th>
              <th className="pb-3 font-medium text-right">Qty</th>
              <th className="pb-3 font-medium text-right">Rate</th>
              <th className="pb-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(quote as any).quote_items?.map((item: any) => (
              <tr key={item.id} className="border-b">
                <td className="py-3">{item.description}</td>
                <td className="py-3 text-right">{item.quantity}</td>
                <td className="py-3 text-right">${Number(item.rate).toFixed(2)}</td>
                <td className="py-3 text-right font-medium">${Number(item.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 space-y-1 text-right text-sm">
          <p>Subtotal: <span className="font-medium">${Number(quote.subtotal).toFixed(2)}</span></p>
          {Number(quote.gst_rate) > 0 && (
            <p>GST ({quote.gst_rate}%): <span className="font-medium">${Number(quote.gst_amount).toFixed(2)}</span></p>
          )}
          <p className="text-xl font-bold border-t pt-2 mt-2">
            Total: ${Number(quote.total).toFixed(2)}
          </p>
        </div>

        {quote.notes && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-medium mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {quote.terms && (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-medium mb-2">Terms</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.terms}</p>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          {accepted ? (
            <div className="text-center text-green-600">
              <CheckCircle className="mx-auto h-8 w-8 mb-2" />
              <p className="font-medium">Quote Accepted</p>
            </div>
          ) : (
            <AcceptPayFlow
              publicToken={publicToken}
              total={Number(quote.total)}
              currency={quote.currency || "INR"}
              onAccepted={() => setAccepted(true)}
            />
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          Powered by <span className="font-semibold">SendQuote</span>
        </p>
      </div>
    </div>
  );
}
