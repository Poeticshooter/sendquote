"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("invoices").select("*, quotes!inner(client_name, quote_number)").eq("id", params.id).single()
        .then(({ data, error }) => {
          if (error) { router.push("/invoices"); return; }
          setInvoice(data);
          setLoading(false);
        });
    });
  }, [params.id, router, supabase]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  if (!invoice) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h2 className="text-2xl font-bold">{invoice.invoice_number}</h2>
            <p className="text-muted-foreground text-sm">{invoice.client_name}</p>
          </div>
        </div>
        <Badge variant={invoice.status === "paid" ? "default" : invoice.status === "overdue" ? "destructive" : "outline"}>
          {invoice.status}
        </Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Client</span><p className="font-medium text-white">{invoice.client_name}</p></div>
            <div><span className="text-muted-foreground">Email</span><p className="font-medium text-white">{invoice.client_email || "—"}</p></div>
            <div><span className="text-muted-foreground">Quote</span><p className="font-medium text-white">{invoice.quotes?.quote_number || "—"}</p></div>
            <div><span className="text-muted-foreground">Due Date</span><p className="font-medium text-white">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}</p></div>
          </div>
          <div className="border-t border-white/[0.06] pt-4 space-y-1 text-right">
            <p className="text-sm text-muted-foreground">Amount: <span className="font-medium text-white">₹{Number(invoice.amount).toLocaleString("en-IN")}</span></p>
            <p className="text-sm text-muted-foreground">Paid: <span className="font-medium text-white">₹{Number(invoice.paid_amount || 0).toLocaleString("en-IN")}</span></p>
            <p className="text-lg font-bold text-white border-t border-white/[0.06] pt-2">
              Balance: ₹{Number(invoice.balance_due || invoice.amount).toLocaleString("en-IN")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
