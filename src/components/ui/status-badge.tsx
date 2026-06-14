import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  draft: {
    label: "Draft",
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    dot: "bg-zinc-400",
  },
  sent: {
    label: "Sent",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  opened: {
    label: "Viewed",
    className: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  viewed: {
    label: "Viewed",
    className: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  accepted: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  changes_requested: {
    label: "Changes",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  expired: {
    label: "Expired",
    className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    dot: "bg-red-500",
  },
  archived: {
    label: "Archived",
    className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    dot: "bg-zinc-400",
  },
  lost: {
    label: "Lost",
    className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    dot: "bg-zinc-400",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    dot: "bg-red-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 line-through",
    dot: "bg-zinc-400",
  },
  partially_paid: {
    label: "Partially Paid",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    dot: "bg-amber-500",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = statusConfig[status] ?? {
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    dot: "bg-zinc-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        config.className,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

/**
 * Returns recommended next action text for a given status.
 * Used in tooltips and cards to guide the user.
 */
export function getNextAction(status: string): string {
  const actions: Record<string, string> = {
    draft: "Review and send to your client",
    sent: "Wait for client to view, or follow up in 2 days",
    opened: "Client viewed this. Follow up now while interest is fresh",
    viewed: "Client viewed this. Follow up now while interest is fresh",
    accepted: "Convert this quote to an invoice and request payment",
    changes_requested: "Review their request and send a revised quote",
    expired: "Send a new quote or mark as lost",
    archived: "Archived quotes can be restored if needed",
    lost: "Mark why you lost to improve future quotes",
    paid: "Payment received. Thank your client for their business",
    pending: "Invoice sent. Payment expected on or before due date",
    overdue: "Send a payment reminder. Consider a follow-up call",
    cancelled: "Notify your client and update your records",
    partially_paid: "Partial payment received. Balance is still due",
  };
  return actions[status] ?? "No action needed";
}
