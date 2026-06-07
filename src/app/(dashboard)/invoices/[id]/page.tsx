"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface InvoiceDetail {
  id: string;
  invoice_number: string;
  client_name: string;
  amount: number;
  status: string;
  paid_amount: number;
  balance_due: number;
  due_date: string;
  created_at: string;
  quotes: { client_name: string; quote_number: string } | null;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("invoices").select("*, quotes!inner(client_name, quote_number)").eq("id", params.id).single()
        .then(({ data, error }) => {
          if (error) { router.push("/invoices"); return; }
          setInvoice(data as unknown as InvoiceDetail);
          setLoading(false);
        });
    });
  }, [params.id, router, supabase]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 rounded-xl" /></div>;
  if (!invoice) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{invoice.invoice_number}</h2>
          <p className="text-muted-foreground">{invoice.client_name}</p>
        </div>
        <Badge>{invoice.status}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-lg font-bold">${invoice.amount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-lg font-bold">${invoice.paid_amount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Balance Due</p>
              <p className="text-lg font-bold">${invoice.balance_due}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="text-lg font-bold">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
