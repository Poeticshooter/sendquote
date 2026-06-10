"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Shield, AlertTriangle, Info, UserCheck } from "lucide-react";

const actionIcons: Record<string, typeof Activity> = {
  view_admin_stats: Activity,
  update_user_plan: UserCheck,
  delete_quote: AlertTriangle,
  system: Shield,
};

export default function AdminLogsPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<{
    id: string; admin_action: string; target_type: string | null;
    target_id: string | null; details: Record<string, unknown> | null; created_at: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => { setLogs(data || []); setLoading(false); });
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  const actionLabel = (action: string) =>
    action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{logs.length} recent events</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {logs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="flex justify-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30">
                  <Shield className="h-6 w-6 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground">No audit logs yet</h3>
              <p className="text-xs text-muted-foreground mt-1">Admin actions will appear here.</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[19px] top-3 bottom-3 w-px bg-muted/30" />
              <div className="space-y-0">
                {logs.map((log) => {
                  const Icon = actionIcons[log.admin_action] || Info;
                  return (
                    <div key={log.id} className="relative flex items-start gap-4 px-2 py-3 hover:bg-muted/20 rounded-lg transition-colors">
                      <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm font-medium text-foreground">{actionLabel(log.admin_action)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.target_type && `${log.target_type}${log.target_id ? ` #${log.target_id.slice(0, 8)}` : ""}`}
                          {log.details && Object.keys(log.details).length > 0 && (
                            <> — {JSON.stringify(log.details).slice(0, 120)}</>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 pt-1 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
