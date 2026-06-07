"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Users, Receipt, BarChart3, Settings, ExternalLink, LayoutDashboard } from "lucide-react";

const actions = [
  { id: "dashboard", label: "Go to Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "new-quote", label: "Create New Quote", icon: FileText, href: "/quotes/new" },
  { id: "quotes", label: "View All Quotes", icon: FileText, href: "/quotes" },
  { id: "clients", label: "View Clients", icon: Users, href: "/clients" },
  { id: "invoices", label: "View Invoices", icon: Receipt, href: "/invoices" },
  { id: "analytics", label: "View Analytics", icon: BarChart3, href: "/analytics" },
  { id: "settings", label: "Open Settings", icon: Settings, href: "/settings" },
  { id: "portal", label: "Client Portal", icon: ExternalLink, href: "/portal" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const filtered = query
    ? actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : actions;

  const handleSelect = useCallback((href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  }, [router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg rounded-xl border border-white/[0.08] bg-[#141414] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <Search className="h-4 w-4 text-white/30" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and actions..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/30">
            ESC
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-white/30">No results found</p>
          )}
          {filtered.map((action) => (
            <button
              key={action.id}
              onClick={() => handleSelect(action.href)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
