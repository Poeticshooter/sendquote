"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type BreadcrumbItem = {
  label: string
  href?: string
}

export default function Breadcrumbs() {
  const pathname = usePathname()

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean)
    const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/dashboard" }]

    if (segments.length === 0) return crumbs

    const pathMap: Record<string, string> = {
      dashboard: "Dashboard",
      invoices: "Invoices",
      quote: "Quotes",
      settings: "Settings",
      upgrade: "Upgrade",
    }

    let currentPath = ""
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const label = pathMap[segment] || (segment === "new" ? "New" : segment)
      
      const isLast = index === segments.length - 1
      crumbs.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        href: isLast ? undefined : currentPath,
      })
    })

    return crumbs
  }

  const breadcrumbs = getBreadcrumbs()

  if (breadcrumbs.length <= 1) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-1.5">
          {index > 0 && (
            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
          {crumb.href ? (
            <Link href={crumb.href} className="text-slate-500 hover:text-slate-700 transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-slate-900 font-medium">{crumb.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}