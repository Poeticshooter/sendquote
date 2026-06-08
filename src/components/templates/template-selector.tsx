"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Template {
  id: string; name: string; description: string; industry: string;
  suggested_items: { description: string; quantity: number; rate: number; unit: string }[];
  suggested_terms: string | null; suggested_payment_terms: string | null;
}

interface Props {
  onSelect: (template: Template) => void;
  className?: string;
}

const industries = ["all", "technology", "consulting", "design", "marketing"];

export function TemplateSelector({ onSelect, className }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState("all");

  useEffect(() => {
    const url = industry === "all" ? "/api/templates" : `/api/templates?industry=${industry}`;
    fetch(url).then(r => r.json()).then(d => {
      setTemplates(d.templates || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, [industry]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-[#00D4AA]" />
        <span className="text-sm font-medium">Quick Templates</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {industries.map(ind => (
          <Button key={ind} variant={industry === ind ? "default" : "outline"} size="sm"
            className={cn("text-xs h-7", industry === ind ? "bg-[#00D4AA] text-black" : "border-white/10")}
            onClick={() => setIndustry(ind)}
          >
            {ind === "all" ? "All" : ind.charAt(0).toUpperCase() + ind.slice(1)}
          </Button>
        ))}
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : templates.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No templates for this category</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {templates.map(t => (
            <button key={t.id} onClick={() => onSelect(t)}
              className="text-left rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] hover:border-[#00D4AA]/20 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-3.5 w-3.5 text-[#00D4AA]" />
                <span className="text-xs font-medium text-white truncate">{t.name}</span>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2">{t.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
