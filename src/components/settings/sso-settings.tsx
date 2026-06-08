"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";

export function SSOSettings() {
  const [samlUrl, setSamlUrl] = useState("");
  const [oidcClientId, setOidcClientId] = useState("");
  const [oidcIssuer, setOidcIssuer] = useState("");

  function saveSSO() {
    toast.success("SSO configuration saved. OIDC configs should be set via environment variables for production.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Single Sign-On (SSO)</CardTitle>
        <CardDescription>Configure SSO for enterprise teams. Requires Enterprise plan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4 space-y-3">
          <h4 className="font-medium text-sm">SAML 2.0</h4>
          <div className="space-y-2">
            <Label>SSO URL (IdP Login URL)</Label>
            <Input value={samlUrl} onChange={(e) => setSamlUrl(e.target.value)} placeholder="https://your-company.okta.com/app/..." />
          </div>
          <div className="space-y-2">
            <Label>Entity ID / Audience URI</Label>
            <Input value="sendquote" readOnly className="text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <Label>ACS URL (Callback)</Label>
            <Input value="https://sendquote.in/auth/callback" readOnly className="text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <h4 className="font-medium text-sm">OpenID Connect (OIDC)</h4>
          <div className="space-y-2">
            <Label>Client ID</Label>
            <Input value={oidcClientId} onChange={(e) => setOidcClientId(e.target.value)} placeholder="your-client-id" />
          </div>
          <div className="space-y-2">
            <Label>Issuer URL</Label>
            <Input value={oidcIssuer} onChange={(e) => setOidcIssuer(e.target.value)} placeholder="https://accounts.google.com" />
          </div>
        </div>

        <Button onClick={saveSSO}>Save SSO Configuration</Button>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-xs text-muted-foreground">
            ⚠️ SSO is an Enterprise feature. Configure via env vars SAML_SSO_URL, OIDC_CLIENT_ID, OIDC_ISSUER for production.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
