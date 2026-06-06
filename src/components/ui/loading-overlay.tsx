import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  loading?: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ loading = true, message = "Loading...", className }: LoadingOverlayProps) {
  if (!loading) return null;
  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm", className)}>
      <div className="flex flex-col items-center gap-3 rounded-xl bg-card p-6 shadow-lg border">
        <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
