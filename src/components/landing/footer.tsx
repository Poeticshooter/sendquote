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
    { href: "/docs/api", label: "API Reference" },
    { href: "/glossary", label: "Glossary" },
    { href: "/comparisons", label: "Comparisons" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                SQ
              </div>
              <span className="text-lg font-bold">SendQuote</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              The fastest path from conversation to contract.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold">{title}</h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SendQuote. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
