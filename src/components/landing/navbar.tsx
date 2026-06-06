"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            SQ
          </div>
          <span className="text-xl font-bold tracking-tight">SendQuote</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost" })}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className={buttonVariants()}
          >
            Get Started Free
          </Link>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden border-t bg-background px-4 pb-4 pt-2 transition-all",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <nav className="flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
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
