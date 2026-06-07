"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

export default function AdminLogsPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<{ id: string; admin_action: string; target_type: string | null; target_id: string | null; details: Record<string, unknown> | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => { setLogs(data || []); setLoading(false); });
  }, [supabase]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
        <p className="text-muted-foreground">System activity and administrative actions.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          {logs.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">No audit logs yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 rounded-lg border border-white/[0.06] p-3 text-sm">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-[#00D4AA] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{log.admin_action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.target_type && `${log.target_type} #${log.target_id?.slice(0, 8)}`}
                      {log.details && ` — ${JSON.stringify(log.details).slice(0, 100)}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
