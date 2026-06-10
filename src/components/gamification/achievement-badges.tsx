"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock, Sparkles, Star, Zap, Award, Target, TrendingUp, Gift, Heart, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementDef {
  key: string; label: string; description: string; icon: string; category: string; threshold?: number;
}

interface Earned {
  achievement: string; unlocked_at: string; metadata?: Record<string, unknown>;
}

export function AchievementBadges() {
  const [definitions, setDefinitions] = useState<AchievementDef[]>([]);
  const [earned, setEarned] = useState<Earned[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/achievements").then(r => r.json()).then(d => {
      setDefinitions(d.definitions || []);
      setEarned(d.earned || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const iconMap: Record<string, typeof Trophy> = {
    trophy: Trophy, star: Star, zap: Zap, award: Award, target: Target,
    trending_up: TrendingUp, gift: Gift, heart: Heart, shield: Shield, users: Users,
  };

  if (loading) return <Skeleton className="h-32 w-full rounded-xl" />;
  if (!definitions.length) return <p className="text-sm text-muted-foreground text-center py-8">No achievements available yet</p>;

  const earnedKeys = new Set(earned.map(e => e.achievement));
  const earnedCount = earned.length;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          Achievements
        </CardTitle>
        <span className="text-xs text-muted-foreground">{earnedCount}/{definitions.length}</span>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {definitions.map((a) => {
            const unlocked = earnedKeys.has(a.key);
            return (
              <div
                key={a.key}
                className={cn(
                  "group relative flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all",
                  unlocked
                    ? "border-[#00D4AA]/20 bg-[#00D4AA]/5 text-foreground"
                    : "border-border bg-muted/30 text-muted-foreground"
                )}
              >
                <span className={unlocked ? "opacity-100" : "opacity-30 saturate-0"}>
                  {unlocked ? (() => { const Icon = iconMap[a.key] || Trophy; return <Icon className="h-3.5 w-3.5" />; })() : <Lock className="h-3 w-3" />}
                </span>
                <span className="font-medium">{a.label}</span>
                {unlocked && (
                  <Sparkles className="h-3 w-3 text-primary" />
                )}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  <div className="bg-gray-900 text-foreground text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                    {a.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
