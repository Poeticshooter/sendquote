"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, X, ExternalLink } from "lucide-react";

export function CrmSettings() {
  const supabase = createClient();
  const [hubspotKey, setHubspotKey] = useState("");
  const [pipedriveKey, setPipedriveKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sendquote_crm_keys");
    if (stored) {
      try {
        const keys = JSON.parse(stored);
        queueMicrotask(() => {
          setHubspotKey(keys.hubspot || "");
          setPipedriveKey(keys.pipedrive || "");
        });
      } catch {}
    }
  }, []);

  function saveKeys() {
    localStorage.setItem("sendquote_crm_keys", JSON.stringify({
      hubspot: hubspotKey,
      pipedrive: pipedriveKey,
    }));
    toast.success("CRM keys saved locally. Add them to your server env vars for production.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CRM Integrations</CardTitle>
        <CardDescription>Connect your CRM to auto-sync quotes. When a quote is accepted, a deal is created in your CRM.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-100 text-orange-700 text-xs font-bold">H</div>
            <span className="font-medium">HubSpot</span>
            {hubspotKey ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="space-y-2">
            <Label>HubSpot API Key (OAuth or Private App Token)</Label>
            <Input
              type="password"
              value={hubspotKey}
              onChange={(e) => setHubspotKey(e.target.value)}
              placeholder="pat-xxxxx or your OAuth token"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Create a private app in HubSpot with <code>deals</code> scope. 
            <a href="https://developers.hubspot.com/docs/api/private-apps" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline ml-1">
              Guide <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-red-100 text-red-700 text-xs font-bold">P</div>
            <span className="font-medium">Pipedrive</span>
            {pipedriveKey ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="space-y-2">
            <Label>Pipedrive API Token</Label>
            <Input
              type="password"
              value={pipedriveKey}
              onChange={(e) => setPipedriveKey(e.target.value)}
              placeholder="Your Pipedrive API token"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Find your token in Pipedrive Settings &gt; Personal &gt; API. 
            <a href="https://pipedrive.readme.io/docs/how-to-find-the-api-token" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline ml-1">
              Guide <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <Button onClick={saveKeys} disabled={saving}>
          {saving ? "Saving..." : "Save CRM Settings"}
        </Button>

        <div className="rounded-lg bg-muted p-4">
          <h4 className="text-sm font-medium mb-1">How it works</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>1. Add your CRM API key above</li>
            <li>2. When a client accepts a quote, SendQuote auto-creates a deal</li>
            <li>3. Deal stage is set to &quot;Closed Won&quot; (HubSpot) or &quot;Won&quot; (Pipedrive)</li>
            <li>4. Quote details and URL are added to the deal notes</li>
            <li className="mt-2 text-yellow-600 dark:text-yellow-400">⚠️ For production, add keys as env vars: HUBSPOT_API_KEY, PIPEDRIVE_API_KEY</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
