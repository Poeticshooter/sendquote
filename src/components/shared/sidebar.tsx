"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  Receipt,
  BarChart3,
  Settings,
  PanelRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

const commonNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/portal", label: "Client Portal", icon: ExternalLink },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminNavItem = { href: "/admin", label: "Admin", icon: ShieldCheck };

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [showAdmin, setShowAdmin] = useState(false);
  const [profile, setProfile] = useState<{ plan: string; used: number; limit: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;
      supabase.from("profiles").select("plan, monthly_quote_count").eq("user_id", user.id).single()
        .then(({ data }) => {
          if (cancelled || !data) return;
          const plan = data.plan || "free";
          setShowAdmin(plan === "pro" || plan === "enterprise");
          const limit = plan === "free" ? 5 : plan === "growth" ? 99999 : 99999;
          setProfile({ plan, used: data.monthly_quote_count || 0, limit });
        });
    });
    return () => { cancelled = true; };
  }, [supabase]);

  const planLabel = profile?.plan === "free" || !profile?.plan ? "Free" :
    profile?.plan === "growth" ? "Growth" :
    profile?.plan === "pro" ? "Pro" : "Enterprise";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo-icon.svg" alt="SendQuote" width={36} height={36} className="h-[60px] w-[60px]" />
            <span className="text-xl font-bold">SendQuote</span>
          </Link>
          <button
            onClick={onToggle}
            className="rounded-md p-1 hover:bg-sidebar-accent lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <PanelRight className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {[...commonNavItems, ...(showAdmin ? [adminNavItem] : [])].map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00D4AA]/10 text-primary font-medium text-xs">
              {profile ? planLabel[0] : "U"}
            </div>
            <div className="flex-1 truncate">
              <p className="font-medium">{profile ? `${planLabel} Plan` : "Free Plan"}</p>
              <p className="text-xs text-muted-foreground">
                {profile ? `${profile.used}/${profile.limit} quotes this month` : "Loading..."}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
