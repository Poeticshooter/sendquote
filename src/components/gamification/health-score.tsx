"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Zap, Target, Users, FileText } from "lucide-react";

interface HealthData {
  score: number; level: string; levelLabel: string; nextMilestone: number;
  winRate: number; recent30d: number; clientCount: number; total: number;
}

export function HealthScore() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health-score").then(r => r.json()).then(d => {
      setData(d); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (!data) return null;

  const levelColors: Record<string, string> = {
    beginner: "from-gray-500 to-gray-400",
    starter: "from-blue-500 to-blue-400",
    growing: "from-amber-500 to-amber-400",
    pro: "from-purple-500 to-purple-400",
    elite: "from-[#00D4AA] to-emerald-400",
  };

  const progress = data.nextMilestone > 0 ? (data.score / data.nextMilestone) * 100 : 100;

  return (
    <Card className="border-border overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${levelColors[data.level] || "from-gray-500 to-gray-400"}`} style={{ width: `${Math.min(progress, 100)}%` }} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          Business Health
        </CardTitle>
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <span className={`w-2 h-2 rounded-full ${data.score >= 60 ? "bg-[#00D4AA]" : data.score >= 30 ? "bg-amber-400" : "bg-red-400"}`} />
          {data.levelLabel}
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold">{data.score}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-3 w-3" /> {data.winRate}% win rate
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-3 w-3" /> {data.recent30d} in 30d
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-3 w-3" /> {data.clientCount} clients
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-3 w-3" /> {data.total} quotes
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
