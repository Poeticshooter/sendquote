export function Skeleton({ className = "", rows = 1 }: { className?: string; rows?: number }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-4 w-full" style={{ width: `${85 - i * 10}%` }} />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-8 w-1/2" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <div className="skeleton h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-slate-50 flex gap-4">
          <div className="skeleton h-4 w-1/5" />
          <div className="skeleton h-4 w-1/4" />
          <div className="skeleton h-4 w-1/6" />
          <div className="skeleton h-4 w-1/6" />
          <div className="skeleton h-4 w-1/6" />
        </div>
      ))}
    </div>
  )
}
