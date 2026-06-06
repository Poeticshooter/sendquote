"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/changelog", label: "What's New" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
            SQ
          </div>
          <span className="text-xl font-bold tracking-tight">SendQuote</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Sign In
          </Link>
          <Link href="/signup" className={buttonVariants({ className: "shadow-lg shadow-primary/20" })}>
            Get Started Free
          </Link>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={cn(
        "md:hidden border-t bg-background px-4 pb-5 pt-3 transition-all duration-200",
        mobileOpen ? "block" : "hidden"
      )}>
        <nav className="flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <hr className="my-2" />
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", className: "w-full justify-start" })}
            onClick={() => setMobileOpen(false)}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className={buttonVariants({ className: "w-full" })}
            onClick={() => setMobileOpen(false)}
          >
            Get Started Free
          </Link>
        </nav>
      </div>
    </header>
  );
}
