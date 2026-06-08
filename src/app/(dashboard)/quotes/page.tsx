"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Quote } from "@/types";

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  sent: "outline",
  opened: "default",
  accepted: "default",
  changes_requested: "outline",
  expired: "destructive",
  archived: "outline",
};

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }

      supabase
        .from("quotes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setQuotes(data || []);
          setLoading(false);
        });
    });
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quotes</h2>
          <p className="text-muted-foreground">Manage and send quotes to your clients.</p>
        </div>
        <Link href="/quotes/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          New Quote
        </Link>
      </div>

      {quotes.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No quotes yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first quote to get started.
          </p>
          <Link href="/quotes/new" className={buttonVariants({ className: "mt-6" })}>
            <Plus className="mr-2 h-4 w-4" />
            Create Quote
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => {
            const quoteUrl = `${window.location.origin}/q/${quote.public_token}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`*Quote ${quote.quote_number}*\n\nHi ${quote.client_name}, I've sent you a quote. View & sign here:\n${quoteUrl}\n\nPowered by SendQuote`)}`;

            return (
              <div key={quote.id} className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <Link href={`/quotes/${quote.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{quote.client_name}</p>
                        <p className="text-sm text-muted-foreground">{quote.quote_number}</p>
                      </div>
                      <div className="text-right mr-3">
                        <p className="font-semibold">₹{Number(quote.total).toLocaleString("en-IN")}</p>
                        <Badge variant={statusColors[quote.status] || "outline"}>
                          {quote.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                  {quote.public_token && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#25D366]/10 text-[#25D366] opacity-0 group-hover:opacity-100 hover:bg-[#25D366]/20 transition-all shrink-0"
                      title="Share on WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
