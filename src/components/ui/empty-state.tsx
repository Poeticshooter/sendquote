import { cn } from "@/lib/utils";
import { FileQuestion, Inbox, SearchX } from "lucide-react";

interface EmptyStateProps {
  icon?: "empty" | "search" | "error";
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

const icons = {
  empty: Inbox,
  search: SearchX,
  error: FileQuestion,
};

export function EmptyState({ icon = "empty", title, description, action, className }: EmptyStateProps) {
  const Icon = icons[icon];
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <Icon className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
