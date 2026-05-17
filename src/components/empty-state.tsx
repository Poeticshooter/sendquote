type EmptyStateProps = {
  type: "quotes" | "clients" | "invoices" | "search" | "templates"
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

const SVG_PATHS: Record<EmptyStateProps["type"], React.ReactNode> = {
  quotes: (
    <svg viewBox="0 0 120 120" fill="none" className="w-32 h-32">
      <rect x="25" y="15" width="70" height="90" rx="8" className="fill-slate-100" />
      <rect x="35" y="30" width="50" height="4" rx="2" className="fill-slate-200" />
      <rect x="35" y="40" width="35" height="4" rx="2" className="fill-slate-200" />
      <rect x="35" y="50" width="45" height="4" rx="2" className="fill-slate-200" />
      <rect x="35" y="60" width="25" height="4" rx="2" className="fill-slate-200" />
      <rect x="35" y="75" width="50" height="12" rx="4" className="fill-indigo-200" />
      <path d="M55 81l4 4 8-8" className="stroke-indigo-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 120 120" fill="none" className="w-32 h-32">
      <circle cx="60" cy="40" r="18" className="fill-slate-200" />
      <circle cx="35" cy="50" r="12" className="fill-slate-100" />
      <circle cx="85" cy="50" r="12" className="fill-slate-100" />
      <path d="M30 80c0-10 8-18 18-18h24c10 0 18 8 18 18v8H30v-8z" className="fill-slate-200" />
      <path d="M15 85c0-8 5-14 12-16" className="stroke-slate-300" strokeWidth="2" strokeLinecap="round" />
      <path d="M105 85c0-8-5-14-12-16" className="stroke-slate-300" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  invoices: (
    <svg viewBox="0 0 120 120" fill="none" className="w-32 h-32">
      <rect x="25" y="10" width="70" height="100" rx="8" className="fill-slate-100" />
      <rect x="35" y="25" width="50" height="4" rx="2" className="fill-slate-200" />
      <rect x="35" y="35" width="40" height="4" rx="2" className="fill-slate-200" />
      <rect x="35" y="45" width="50" height="4" rx="2" className="fill-slate-200" />
      <rect x="35" y="55" width="30" height="4" rx="2" className="fill-slate-200" />
      <rect x="35" y="70" width="50" height="20" rx="4" className="fill-emerald-100" />
      <path d="M50 80l6 6 12-12" className="stroke-emerald-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 120 120" fill="none" className="w-32 h-32">
      <circle cx="50" cy="50" r="22" className="stroke-slate-300" strokeWidth="3" />
      <path d="M66 66l20 20" className="stroke-slate-300" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 45c0-5 4-10 10-10" className="stroke-slate-200" strokeWidth="2" strokeLinecap="round" />
      <path d="M35 55c0-8 6-15 15-15" className="stroke-slate-200" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  templates: (
    <svg viewBox="0 0 120 120" fill="none" className="w-32 h-32">
      <rect x="15" y="20" width="40" height="55" rx="6" className="fill-slate-100" />
      <rect x="65" y="20" width="40" height="55" rx="6" className="fill-slate-100" />
      <rect x="22" y="30" width="26" height="4" rx="2" className="fill-slate-200" />
      <rect x="22" y="38" width="18" height="4" rx="2" className="fill-slate-200" />
      <rect x="22" y="46" width="22" height="4" rx="2" className="fill-slate-200" />
      <rect x="72" y="30" width="26" height="4" rx="2" className="fill-slate-200" />
      <rect x="72" y="38" width="18" height="4" rx="2" className="fill-slate-200" />
      <rect x="72" y="46" width="22" height="4" rx="2" className="fill-slate-200" />
      <circle cx="40" cy="95" r="12" className="fill-indigo-100" />
      <path d="M36 95l3 3 6-6" className="stroke-indigo-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M70 95l20 0" className="stroke-slate-300" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
    </svg>
  ),
}

export default function EmptyState({ type, title, description, action }: EmptyStateProps) {
  return (
    <div className="p-16 text-center animate-fade-in">
      <div className="mx-auto mb-6">
        {SVG_PATHS[type]}
      </div>
      <p className="text-slate-600 font-medium mb-1">{title}</p>
      <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">{description}</p>
      {action && (
        <a
          href={action.href}
          className="inline-flex bg-indigo-600 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {action.label}
        </a>
      )}
    </div>
  )
}
