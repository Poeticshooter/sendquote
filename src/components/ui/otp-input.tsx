"use client";

import { useRef, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export function OTPInput({ length = 6, value, onChange }: OTPInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < length - 1) inputs.current[index + 1]?.focus();
  }

  function handleChange(val: string, index: number) {
    if (!/^\d*$/.test(val)) return;
    const newVal = value.split("");
    newVal[index] = val.slice(-1);
    onChange(newVal.join(""));
    if (val && index < length - 1) inputs.current[index + 1]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <Input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          maxLength={1}
          inputMode="numeric"
          pattern="\d*"
          value={value[i] || ""}
          onChange={(e) => handleChange(e.target.value, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="h-12 w-12 text-center text-lg"
        />
      ))}
    </div>
  );
}
