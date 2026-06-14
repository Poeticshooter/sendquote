import Link from "next/link";

const footerLinks = {
  Product: [{ href: "/pricing", label: "Pricing" }, { href: "/#features", label: "Features" }, { href: "/changelog", label: "Changelog" }, { href: "/docs", label: "Documentation" }],
  Company: [{ href: "/about", label: "About" }, { href: "/blog", label: "Blog" }, { href: "/contact", label: "Contact" }, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }],
  Support: [{ href: "mailto:support@sendquote.in", label: "Email: support@sendquote.in (4hr reply)" }, { href: "/faq", label: "FAQ" }, { href: "/docs", label: "Documentation" }],
};

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black text-xs font-bold">
                <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><path d="M10 12h12M10 16h8M10 20h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M22 16l5 5-5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-lg font-bold text-foreground">SendQuote</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">The fastest path from conversation to contract. AI-powered quoting for modern businesses.</p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-foreground/80">{title}</h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}><Link href={link.href} className="text-sm text-muted-foreground hover:text-white transition-colors">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SendQuote. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
