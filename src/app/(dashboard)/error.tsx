"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message || "An unexpected error occurred"}</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
