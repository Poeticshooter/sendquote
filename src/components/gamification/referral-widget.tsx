"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Check, Send, Share2 } from "lucide-react";
import { toast } from "sonner";

export function ReferralWidget() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [baseUrl] = useState(typeof window !== "undefined" ? window.location.origin : "");
  const referralLink = `${baseUrl}?ref=sendquote`;

  async function handleRefer() {
    if (!email) return;
    setSending(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success("Invitation sent! You'll get 1 month free when they join.");
      setEmail("");
    } catch {
      toast.error("Failed to send invitation");
    }
    setSending(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Gift className="h-4 w-4 text-rose-400" />
          Refer & Earn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Get <span className="text-primary font-medium">1 month free</span> for every friend who joins SendQuote.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="friend@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-muted/30 border-border text-foreground text-sm h-9"
          />
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0" onClick={handleRefer} disabled={sending} aria-label="Send invitation">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-border text-xs flex-1 h-8" onClick={copyLink}>
            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            Copy Referral Link
          </Button>
          <Button variant="outline" size="sm" className="border-border text-xs h-8" onClick={() => {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent("I'm using SendQuote to close deals faster! Try it free: " + referralLink)}`, "_blank");
          }}>
            <Share2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
