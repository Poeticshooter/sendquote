"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X, Mail, User } from "lucide-react";

export function TeamSettings() {
  const supabase = createClient();
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("team_members").select("*").eq("account_user_id", user.id).order("created_at", { ascending: false })
        .then(({ data }) => { setMembers(data || []); setLoading(false); });
    });
  }, [supabase]);

  async function inviteMember() {
    if (!email.trim()) { toast.error("Enter an email address"); return; }
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    if (res.ok) { toast.success("Invitation sent!"); setEmail(""); } 
    else { const err = await res.json(); toast.error(err.error || "Failed to invite"); }
  }

  async function handleRemoveInvite(id: string) {
    const res = await fetch("/api/team/invite", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success("Invitation removed");
    } else {
      toast.error("Failed to remove invitation");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-2">
            <Label>Invite by email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" className="bg-white/5 border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => v && setRole(v)}>
              <SelectTrigger className="h-9 w-28 border-white/10 bg-white/5 text-sm text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={inviteMember} size="sm"><Plus className="mr-1 h-3 w-3" /> Invite</Button>
        </div>

        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No team members yet. Invite someone above.</p>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white">
                    {m.email?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{m.email}</p>
                    <p className="text-xs text-muted-foreground"><Badge variant="outline" className="text-[10px]">{m.role}</Badge> · {m.status}</p>
                  </div>
                </div>
                {m.status === "invited" && (
                  <button className="cursor-pointer text-muted-foreground hover:text-white transition-colors" onClick={() => handleRemoveInvite(m.id)} aria-label={`Remove invite for ${m.email}`}><X className="h-4 w-4" /></button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
