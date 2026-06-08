"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles, Send } from "lucide-react";

interface FollowUpPanelProps {
  quoteId: string;
}

export function FollowUpPanel({ quoteId }: FollowUpPanelProps) {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  async function generateAI() {
    setLoading(true);
    const res = await fetch("/api/ai/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_id: quoteId }),
    });

    if (res.ok) {
      const data = await res.json();
      setSubject(data.subject);
      setBody(data.body);
      toast.success("AI follow-up generated!");
    } else {
      toast.error("Failed to generate follow-up");
    }
    setLoading(false);
  }

  async function sendEmail() {
    if (!subject || !body) { toast.error("Generate or write a follow-up first"); return; }
    toast.success("Follow-up sent! (email sending coming with Resend setup)");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Follow-Up
          </span>
          <Button size="sm" variant="outline" onClick={generateAI} disabled={loading}>
            {loading ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Generating...</> : "Generate AI"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={loading}
        />
        <Textarea
          placeholder="Write your follow-up message or generate one with AI..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          disabled={loading}
        />
        <Button className="w-full" onClick={sendEmail} disabled={!subject || !body}>
          <Send className="mr-2 h-4 w-4" />
          Send Follow-Up <span className="ml-1.5 text-[10px] opacity-60">(Coming Soon)</span>
        </Button>
      </CardContent>
    </Card>
  );
}
