"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/faq", label: "FAQ" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-black/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black text-xs font-bold transition-transform group-hover:scale-105">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><path d="M10 12h12M10 16h8M10 20h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M22 16l5 5-5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">SendQuote</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className={buttonVariants({ variant: "ghost", className: "text-white/70 hover:text-white" })}>Sign In</Link>
          <Link href="/signup" className="inline-flex h-9 items-center justify-center rounded-xl bg-[#00D4AA] px-5 text-sm font-semibold text-black hover:bg-[#00D4AA]/90 transition-all">Get Started</Link>
        </div>

        <button className="md:hidden rounded-lg p-2 text-white/50 hover:bg-white/5" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-black px-4 pb-5 pt-3">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white" onClick={() => setMobileOpen(false)}>{link.label}</Link>
            ))}
            <hr className="border-white/[0.06] my-2" />
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm text-white/70" onClick={() => setMobileOpen(false)}>Sign In</Link>
            <Link href="/signup" className="rounded-lg bg-[#00D4AA] px-3 py-2 text-sm font-semibold text-black text-center" onClick={() => setMobileOpen(false)}>Get Started</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
