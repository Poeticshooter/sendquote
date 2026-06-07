"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Receipt } from "lucide-react";

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  paid: "default",
  pending: "outline",
  overdue: "destructive",
  cancelled: "secondary",
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("invoices").select("*, quotes(client_name)").eq("user_id", user.id).order("created_at", { ascending: false })
        .then(({ data }) => { setInvoices(data || []); setLoading(false); });
    });
  }, [router]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
        <p className="text-muted-foreground">All invoices generated from accepted quotes.</p>
      </div>

      {invoices.length === 0 ? (
        <Card className="p-12 text-center">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No invoices yet</h3>
          <p className="text-sm text-muted-foreground">Invoices are auto-generated when a quote is accepted and paid.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`} className="block rounded-lg border bg-card p-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{inv.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">{inv.client_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{Number(inv.total || inv.amount).toLocaleString("en-IN")}</p>
                  <Badge variant={statusColors[inv.status] || "outline"}>{inv.status}</Badge>
                </div>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "N/A"}</span>
                <span>Paid: ₹{Number(inv.paid_amount || 0).toLocaleString("en-IN")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
