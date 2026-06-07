"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/ui/search-input";

interface AdminUser {
  id: string;
  user_id: string;
  business_name: string | null;
  plan: string;
  created_at: string;
  users: { email: string };
}

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("*, users:auth.users!inner(email)").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setUsers((data || []) as unknown as AdminUser[]); setLoading(false); });
  }, [supabase]);

  const filtered = search
    ? users.filter((u) => u.business_name?.toLowerCase().includes(search.toLowerCase()) || u.users?.email?.includes(search))
    : users;

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">{users.length} registered users</p>
        </div>
        <div className="w-64">
          <SearchInput placeholder="Search users..." onSearch={setSearch} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-muted-foreground">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Business</th>
                <th className="p-4 font-medium">Plan</th>
                <th className="p-4 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-white/[0.06] last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white">
                        {(u.business_name || "?")[0]}
                      </div>
                      <div>
                        <p className="font-medium text-white">{u.users?.email || "N/A"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-white/60">{u.business_name || "—"}</td>
                  <td className="p-4"><Badge variant="outline">{u.plan}</Badge></td>
                  <td className="p-4 text-white/40">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
