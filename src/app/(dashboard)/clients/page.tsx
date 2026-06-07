"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Plus, Users, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("clients").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
        .then(({ data }) => { setClients(data || []); setLoading(false); });
    });
  }, [router]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">People and businesses you send quotes to.</p>
        </div>
        <Link href="/quotes/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" /> New Client
        </Link>
      </div>

      {clients.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No clients yet</h3>
          <p className="text-sm text-muted-foreground">Clients are auto-saved when you create quotes.</p>
          <Link href="/quotes/new" className={buttonVariants({ className: "mt-6" })}>
            <Plus className="mr-2 h-4 w-4" /> Create Your First Quote
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  {client.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{client.name}</p>
                  {client.email && (
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3 shrink-0" /> {client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0" /> {client.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground border-t pt-3">
                <span>{client.total_quotes} quotes</span>
                <span>₹{client.total_revenue}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
