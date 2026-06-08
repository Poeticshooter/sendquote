"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/quotes/new", label: "New", icon: Plus, highlight: true },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-sidebar backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : item.href === "/quotes"
              ? pathname === "/quotes" || (pathname.startsWith("/quotes/") && !pathname.startsWith("/quotes/new"))
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors min-w-[56px]",
                item.highlight
                  ? "text-[#00D4AA]"
                  : isActive
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className={cn(
                "flex items-center justify-center",
                item.highlight && "flex h-9 w-9 items-center justify-center rounded-full bg-[#00D4AA] text-black -mt-3 shadow-lg shadow-[#00D4AA]/20",
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
