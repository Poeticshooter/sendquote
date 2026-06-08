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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#0D0D0D]/95 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors min-w-[56px]",
                item.highlight
                  ? "text-[#00D4AA]"
                  : isActive
                    ? "text-white"
                    : "text-white/40 hover:text-white/70",
              )}
            >
              <div className={cn(
                "flex items-center justify-center",
                item.highlight && "flex h-9 w-9 items-center justify-center rounded-full bg-[#00D4AA] text-black -mt-3 shadow-lg shadow-[#00D4AA]/20",
              )}>
                <item.icon className={cn("h-5 w-5", item.highlight ? "h-5 w-5" : "h-5 w-5")} />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
