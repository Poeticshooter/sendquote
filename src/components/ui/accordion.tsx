"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface AccordionItem {
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border bg-card">
          <button
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            {item.title}
            <ChevronDown className={cn("h-4 w-4 transition-transform", openIndex === i && "rotate-180")} />
          </button>
          {openIndex === i && (
            <div className="border-t px-4 py-3 text-sm text-muted-foreground">{item.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}
