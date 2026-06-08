"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalRulesSettings } from "@/components/settings/approval-rules";
import { CrmSettings } from "@/components/settings/crm-settings";
import { SSOSettings } from "@/components/settings/sso-settings";
import { BillingSettings } from "@/components/settings/billing-settings";
import { TeamSettings } from "@/components/settings/team-settings";
import { FollowupSettings } from "@/components/settings/followup-settings";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<{ id: string; business_name: string | null; phone: string | null; gst_number: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [gst, setGst] = useState("");
  const [gstValid, setGstValid] = useState<boolean | null>(null);
  const [gstChecking, setGstChecking] = useState(false);

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

  useEffect(() => {
    if (!gst || gst.length < 15) return;
    const timer = setTimeout(async () => {
      setGstChecking(true);
      try {
        const res = await fetch(`/api/gst/validate?gst=${encodeURIComponent(gst)}`);
        const data = await res.json();
        setGstValid(data.valid === true);
      } catch { setGstValid(null); }
      setGstChecking(false);
    }, 600);
    return () => { clearTimeout(timer); setGstChecking(false); };
  }, [gst]);

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
                  <div className="relative">
                    <Input id="gst" value={gst} onChange={(e) => setGst(e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {gstChecking ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> :
                       gstValid === true ? <CheckCircle className="h-4 w-4 text-[#00D4AA]" /> :
                       gstValid === false ? <XCircle className="h-4 w-4 text-red-400" /> : null}
                    </div>
                  </div>
                  {gst && gstValid === true && <p className="text-xs text-[#00D4AA]">Valid GST format ✓</p>}
                  {gstValid === false && <p className="text-xs text-red-400">Invalid GST number format</p>}
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
