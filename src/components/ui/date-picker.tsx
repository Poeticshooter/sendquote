"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {value ? new Date(value).toLocaleDateString() : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <input
          type="date"
          value={value || ""}
          min={today}
          onChange={(e) => {
            onChange?.(e.target.value);
            setOpen(false);
          }}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </PopoverContent>
    </Popover>
  );
}
