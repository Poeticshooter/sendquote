"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-start gap-2">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <div key={i} className="flex-1">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isCompleted && "bg-foreground text-background",
                  isCurrent && "border-2 border-foreground text-foreground",
                  !isCompleted && !isCurrent && "border-2 border-muted-foreground/30 text-muted-foreground/50"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  "h-px flex-1",
                  isCompleted ? "bg-foreground" : "bg-muted-foreground/20"
                )} />
              )}
            </div>
            <p className={cn(
              "mt-2 text-sm font-medium",
              isCurrent ? "text-foreground" : "text-muted-foreground"
            )}>
              {step.title}
            </p>
            {step.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
