"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Sequence {
  id: string; name: string; trigger_days: number[];
  trigger_condition: string; is_active: boolean;
}

export function FollowupSettings() {
  const supabase = createClient();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("followup_sequences")
        .select("*")
        .or(`user_id.eq.${user.id},user_id.eq.00000000-0000-0000-0000-000000000000`)
        .order("name")
        .then(({ data }) => {
          setSequences(data || []);
          setLoading(false);
        });
    });
  }, [supabase]);

  async function toggleSequence(id: string, active: boolean) {
    const { error } = await supabase
      .from("followup_sequences")
      .update({ is_active: active })
      .eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    setSequences(prev => prev.map(s => s.id === id ? { ...s, is_active: active } : s));
    toast.success(active ? "Sequence activated" : "Sequence paused");
  }

  const conditionLabels: Record<string, string> = {
    sent: "After sending",
    opened_no_response: "Opened, no reply",
    expiring_soon: "Expiring soon",
    expired: "After expiry",
  };

  if (loading) return <Skeleton className="h-32 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Follow-up Sequences
          </CardTitle>
          <CardDescription>Auto-send follow-up emails after sending quotes.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sequences.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No follow-up sequences configured.
          </div>
        ) : (
          sequences.map((seq) => (
            <div key={seq.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{seq.name}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {conditionLabels[seq.trigger_condition] || seq.trigger_condition}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Triggers at day {seq.trigger_days.join(", ")}
                </p>
              </div>
              <Switch
                checked={seq.is_active}
                onCheckedChange={(checked) => toggleSequence(seq.id, checked)}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
