"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Logo } from "@/components/shared/logo";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { m } from "@/components/shared/motion-client";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/faq", label: "FAQ" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group">
                  <Logo size={40} variant="icon" className="h-10 w-10 transition-transform group-hover:scale-105" />
          <span className="text-xl font-bold tracking-tight text-foreground">SendQuote</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ variant: "ghost", className: "text-muted-foreground hover:text-white" })}>Sign In</Link>
          <Link href="/signup" className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all">Get Started</Link>
        </div>

        <button className="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted/30 transition-colors duration-200" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation menu" aria-expanded={mobileOpen}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="md:hidden border-t border-border bg-background px-4 pb-5 pt-3"
        >
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/30 hover:text-white" onClick={() => setMobileOpen(false)}>{link.label}</Link>
            ))}
            <hr className="border-border my-2" />
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Sign In</Link>
            <Link href="/signup" className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground text-center" onClick={() => setMobileOpen(false)}>Get Started</Link>
          </nav>
        </m.div>
      )}
    </header>
  );
}
