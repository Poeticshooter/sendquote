import Link from "next/link";

const footerLinks = {
  Product: [
    { href: "/pricing", label: "Pricing" },
    { href: "/#features", label: "Features" },
    { href: "/changelog", label: "Changelog" },
    { href: "/docs", label: "Documentation" },
  ],
  Company: [
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
  Resources: [
    { href: "/docs/api", label: "API" },
    { href: "/glossary", label: "Glossary" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t px-4 py-16 sm:px-6 lg:px-8 bg-muted/20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo-icon.svg" alt="" className="h-8 w-8" />
              <span className="text-lg font-bold">SendQuote</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              The fastest path from conversation to contract. AI-powered quoting platform for modern businesses.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold">{title}</h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SendQuote. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
