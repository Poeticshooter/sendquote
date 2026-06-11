"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, FileText, Download, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatINR } from "@/lib/currency";

interface PortalQuote {
  id: string;
  quoteNumber: string;
  clientName: string;
  status: string;
  total: number;
  createdAt: string;
  publicUrl: string;
  contractUrl: string | null;
  invoices: { number: string; amount: number; status: string; paidAmount: number }[];
  paymentCount: number;
}

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary", sent: "outline", opened: "default", accepted: "default",
  expired: "destructive",
};

export default function PortalPage() {
  const [email, setEmail] = useState("");
  const [quotes, setQuotes] = useState<PortalQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function searchPortal() {
    if (!email.trim()) { toast.error("Enter your email"); return; }
    setLoading(true);
    setSearched(true);

    const res = await fetch("/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      const data = await res.json();
      setQuotes(data.quotes || []);
      if (data.quotes?.length === 0) toast.info("No records found for this email");
    } else {
      toast.error("Search failed");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Client Portal</h2>
        <p className="text-muted-foreground">View your quotes, contracts, invoices, and payments.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Your Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="portalEmail">Enter the email address where you received your quote</Label>
              <Input
                id="portalEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                onKeyDown={(e) => e.key === "Enter" && searchPortal()}
              />
            </div>
            <Button onClick={searchPortal} disabled={loading} className="mt-6">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {quotes.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">{quotes.length} record{quotes.length !== 1 ? "s" : ""} found</h3>
          {quotes.map((q) => (
            <Card key={q.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{q.quoteNumber}</p>
                    <p className="text-sm text-muted-foreground">{q.clientName}</p>
                    <p className="text-sm text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatINR(q.total)}</p>
                    <Badge variant={statusColors[q.status] || "outline"}>{q.status}</Badge>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {q.publicUrl ? (
                    <a href={q.publicUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <ExternalLink className="mr-1 h-3 w-3" /> View Quote
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Use the link from your email to view this quote</span>
                  )}
                  {q.contractUrl && (
                    <a href={q.contractUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <Download className="mr-1 h-3 w-3" /> Contract
                    </a>
                  )}
                </div>

                {q.invoices.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Invoices</p>
                    {q.invoices.map((inv, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{inv.number}</span>
                        <span>{formatINR(inv.amount)} — <Badge variant="outline" className="text-xs">{inv.status}</Badge></span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searched && quotes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No records found for this email.</p>
            <p className="text-sm text-muted-foreground">Check the email address where your quote was sent.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
