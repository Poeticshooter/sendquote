export function getStatusStyle(status: string): string {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-50 text-blue-700",
    opened: "bg-amber-50 text-amber-700",
    accepted: "bg-emerald-50 text-emerald-700",
    changes_requested: "bg-violet-50 text-violet-700",
    expired: "bg-red-50 text-red-700",
    lost: "bg-slate-100 text-slate-500",
    archived: "bg-slate-100 text-slate-400",
  }
  return styles[status] || styles.draft
}

export function getStatusStyleCompact(status: string): string {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-100 text-blue-700",
    opened: "bg-amber-100 text-amber-700",
    accepted: "bg-emerald-100 text-emerald-700",
    changes_requested: "bg-violet-100 text-violet-700",
    expired: "bg-red-100 text-red-700",
    lost: "bg-slate-100 text-slate-600",
    archived: "bg-slate-100 text-slate-500",
  }
  return styles[status] || styles.draft
}
