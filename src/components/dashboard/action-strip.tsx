import Link from "next/link";

interface ActionItem {
  id: string;
  type: "warning" | "success" | "info" | "danger";
  message: string;
  actionLabel: string;
  actionHref: string;
}

const colors: Record<string, string> = {
  warning: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200",
  info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
  danger: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
};

export function ActionStrip({ items }: { items: ActionItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${colors[item.type]}`}
        >
          <span className="flex-1">{item.message}</span>
          <Link
            href={item.actionHref}
            className="shrink-0 font-semibold underline underline-offset-2 whitespace-nowrap"
          >
            {item.actionLabel} →
          </Link>
        </div>
      ))}
    </div>
  );
}
