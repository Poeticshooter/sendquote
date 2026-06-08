"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, AlertTriangle, Lightbulb, Bell, ArrowRight, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Suggestion {
  type: string;
  message: string;
  priority: "high" | "medium" | "low";
}

interface CopilotData {
  quoteNumber: string;
  daysSinceCreation: number;
  viewedCount: number;
  suggestions: Suggestion[];
  score: number;
}

const priorityColors: Record<string, "destructive" | "secondary" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

const typeIcons: Record<string, typeof Sparkles> = {
  action: ArrowRight,
  follow_up: Bell,
  alert: AlertTriangle,
  risk: AlertTriangle,
  tip: Lightbulb,
};

export function DealCopilot({ quoteId }: { quoteId: string }) {
  const [data, setData] = useState<CopilotData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_id: quoteId }),
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); toast.error("Failed to load suggestions"); });
  }, [quoteId]);

  if (loading) return <Skeleton className="h-48 rounded-xl" />;
  if (!data) return (
    <Card>
      <CardContent className="flex items-center gap-3 p-6">
        <XCircle className="h-5 w-5 text-destructive" />
        <div>
          <p className="text-sm font-medium">Failed to load suggestions</p>
          <p className="text-xs text-muted-foreground">Could not fetch AI copilot data. Please try again later.</p>
        </div>
      </CardContent>
    </Card>
  );

  const scoreColor = data.score >= 70 ? "text-green-500" : data.score >= 40 ? "text-amber-500" : "text-red-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Deal Copilot
          </span>
          <span className="flex items-center gap-2 text-sm font-normal">
            Score: <span className={`text-lg font-bold ${scoreColor}`}>{data.score}/100</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{data.daysSinceCreation} days old</span>
          <span>{data.viewedCount} views</span>
        </div>
        {data.suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No suggestions. Deal is on track.</p>
        ) : (
          data.suggestions.map((s, i) => {
            const Icon = typeIcons[s.type] || Lightbulb;
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border p-3 text-sm"
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${
                  s.priority === "high" ? "text-destructive" : "text-muted-foreground"
                }`} />
                <div className="flex-1">
                  <p>{s.message}</p>
                </div>
                <Badge variant={priorityColors[s.priority] || "outline"} className="shrink-0 text-xs capitalize">
                  {s.priority}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
