"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface ApprovalRule {
  id: string;
  name: string;
  trigger_type: string;
  trigger_value: number;
  approver_role: string;
  action: string;
  active: boolean;
}

export function ApprovalRulesSettings() {
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("discount_percent");
  const [triggerValue, setTriggerValue] = useState("");
  const [approverRole, setApproverRole] = useState("manager");
  const supabase = createClient();

  useEffect(() => {
    supabase.from("approval_rules").select("*").order("created_at")
      .then(({ data }) => setRules(data || []));
  }, [supabase]);

  async function addRule() {
    if (!name || !triggerValue) { toast.error("Fill in all fields"); return; }

    const res = await fetch("/api/approval-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, trigger_type: triggerType, trigger_value: Number(triggerValue), approver_role: approverRole }),
    });

    if (res.ok) {
      const rule = await res.json();
      setRules([...rules, rule]);
      setShowForm(false);
      setName("");
      setTriggerValue("");
      toast.success("Approval rule added");
    } else {
      toast.error("Failed to add rule");
    }
  }

  async function deleteRule(id: string) {
    const res = await fetch("/api/approval-rules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setRules(rules.filter((r) => r.id !== id));
      toast.success("Rule removed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Approval Rules</CardTitle>
            <CardDescription>Automatically route quotes for approval based on conditions.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" /> Add Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Large discount approval" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select value={triggerType} onValueChange={(v) => v && setTriggerType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount_percent">Discount %</SelectItem>
                    <SelectItem value="discount_amount">Discount $</SelectItem>
                    <SelectItem value="total_amount">Total $</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input type="number" value={triggerValue} onChange={(e) => setTriggerValue(e.target.value)} placeholder="10" />
              </div>
              <div className="space-y-2">
                <Label>Approver</Label>
                <Select value={approverRole} onValueChange={(v) => v && setApproverRole(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="director">Director</SelectItem>
                    <SelectItem value="vp">VP</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addRule}>Save Rule</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {rules.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No approval rules yet. Add rules to automatically route quotes for approval.
          </p>
        )}

        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm">{rule.name}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {rule.trigger_type === "discount_percent" ? "Discount >" : rule.trigger_type === "total_amount" ? "Total >" : "Discount $ >"} {rule.trigger_value}
                  {rule.trigger_type === "discount_percent" ? "%" : "$"}
                </Badge>
                <Badge variant="secondary" className="text-xs">→ {rule.approver_role}</Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
