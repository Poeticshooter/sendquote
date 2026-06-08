"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { UserNav } from "@/components/shared/user-nav";
import { CommandPalette } from "@/components/shared/command-palette";
import { BottomNav } from "@/components/shared/bottom-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col pb-16 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] bg-background px-4 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <UserNav onMenuToggle={() => setSidebarOpen(true)} />
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <BottomNav />
      <CommandPalette />
    </div>
  );
}
