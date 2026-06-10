"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Mail, Building2, UserCheck } from "lucide-react";

interface AdminUser {
  id: string;
  user_id: string;
  business_name: string | null;
  plan: string;
  created_at: string;
  monthly_quote_count: number;
  users: { email: string };
}

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    supabase.from("profiles").select("*, users:auth.users!inner(email)")
      .order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setUsers((data || []) as unknown as AdminUser[]); setLoading(false); });
  }, [supabase]);

  const filtered = search
    ? users.filter((u) =>
        u.business_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.users?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const planColors: Record<string, string> = {
    starter: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    growth: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    pro: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    enterprise: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-0.5">
            <UserCheck className="h-3.5 w-3.5" />
            {users.length} registered user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="w-full sm:w-64">
          <SearchInput placeholder="Search by name or email..." onSearch={setSearch} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Business</th>
                  <th className="p-4 font-medium">Plan</th>
                  <th className="p-4 font-medium">Quotes</th>
                  <th className="p-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-medium text-primary">
                          {(u.business_name || u.users?.email || "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[200px] flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                            {u.users?.email || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {u.business_name ? (
                          <><Building2 className="h-3 w-3 shrink-0" />{u.business_name}</>
                        ) : "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={`capitalize ${planColors[u.plan] || ""}`}>{u.plan}</Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{u.monthly_quote_count}</td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="border-border" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Page {page + 1} of {pageCount}
          </span>
          <Button variant="outline" size="sm" className="border-border" disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
