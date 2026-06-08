"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalRulesSettings } from "@/components/settings/approval-rules";
import { CrmSettings } from "@/components/settings/crm-settings";
import { SSOSettings } from "@/components/settings/sso-settings";
import { BillingSettings } from "@/components/settings/billing-settings";
import { TeamSettings } from "@/components/settings/team-settings";
import { FollowupSettings } from "@/components/settings/followup-settings";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<{ id: string; business_name: string | null; phone: string | null; gst_number: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [gst, setGst] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
        if (data) {
          setProfile(data);
          setBusinessName(data.business_name || "");
          setPhone(data.phone || "");
          setGst(data.gst_number || "");
        }
        setLoading(false);
      });
    });
  }, [router, supabase]);

  async function saveProfile() {
    if (!profile) return;
    const { error } = await supabase
      .from("profiles")
      .update({ business_name: businessName, phone, gst_number: gst, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (error) toast.error(error.message);
    else toast.success("Settings saved!");
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and business settings.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="approvals">Approval Rules</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="sso">SSO</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Your business information appears on quotes and invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst">GST Number</Label>
                  <Input id="gst" value={gst} onChange={(e) => setGst(e.target.value)} />
                </div>
              </div>
              <Button onClick={saveProfile}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <ApprovalRulesSettings />
        </TabsContent>

        <TabsContent value="crm" className="mt-4">
          <CrmSettings />
        </TabsContent>
        <TabsContent value="billing" className="mt-4">
          <BillingSettings />
        </TabsContent>

        <TabsContent value="sso" className="mt-4">
          <SSOSettings />
        </TabsContent>
        <TabsContent value="team" className="mt-4">
          <TeamSettings />
        </TabsContent>
        <TabsContent value="followups" className="mt-4">
          <FollowupSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
