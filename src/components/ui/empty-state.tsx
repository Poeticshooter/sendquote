import { cn } from "@/lib/utils";
import Link from "next/link";
import { FileText, Users, Plus, Eye, Search, ClipboardList } from "lucide-react";

interface EmptyStateProps {
  icon: "quotes" | "clients" | "items" | "activity" | "search" | "generic";
  title?: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
}

const config = {
  quotes: {
    icon: FileText,
    title: "No quotes yet",
    description:
      'Describe your project and create a professional GST-ready quote in 60 seconds. Your client can view, approve, and pay — all from their phone.',
    action: { label: "Create Your First Quote", href: "/quotes/new" },
  },
  clients: {
    icon: Users,
    title: "No clients yet",
    description:
      "Add your first client with just a name and email. SendQuote will remember their details for future quotes.",
    action: { label: "Add Client", href: "/clients" },
  },
  items: {
    icon: ClipboardList,
    title: "No items added",
    description:
      "Add the products or services you're quoting for. Type a name and price — or let AI suggest items based on your description.",
    action: { label: "Add Item", href: "#" },
  },
  activity: {
    icon: Eye,
    title: "No activity yet",
    description:
      "Share this quote link with your client on WhatsApp or email. You'll see when they open it and what they look at.",
    action: { label: "Share Quote Link", href: "#" },
  },
  search: {
    icon: Search,
    title: "No results found",
    description:
      "Try a different search term or browse your full list of quotes and invoices.",
  },
  generic: {
    icon: FileText,
    title: "Nothing here yet",
    description:
      "This section will show up once you start using SendQuote.",
  },
};

const icons = {
  quotes: FileText,
  clients: Users,
  items: ClipboardList,
  activity: Eye,
  search: Search,
  generic: FileText,
};

export function EmptyState({
  icon = "generic",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const c = config[icon] as typeof config["quotes"];
  const Icon = icons[icon];
  const resolvedTitle = title ?? c.title;
  const resolvedDescription = description ?? c.description;
  const resolvedAction = action ?? (c.action ? { label: c.action.label, href: c.action.href } : undefined);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/5">
        <Icon className="h-6 w-6 text-primary/60" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{resolvedTitle}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {resolvedDescription}
      </p>
      {resolvedAction && resolvedAction.href !== "#" && (
        <Link
          href={resolvedAction.href}
          className="mt-5 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <Plus className="h-4 w-4" />
          {resolvedAction.label}
        </Link>
      )}
    </div>
  );
}
