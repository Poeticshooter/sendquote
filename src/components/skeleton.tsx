export function Skeleton({ className = "", rows = 1 }: { className?: string; rows?: number }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-4 w-full" style={{ width: `${85 - i * 10}%` }} />
      ))}
    </div>
  )
}

export function SkeletonText({ width = "w-full", height = "h-4" }: { width?: string; height?: string }) {
  return <div className={`skeleton ${height} ${width} rounded`} />
}

export function SkeletonCircle({ size = "w-10 h-10" }: { size?: string }) {
  return <div className={`skeleton ${size} rounded-full`} />
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-8 w-1/2" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  )
}

export const CardSkeleton = SkeletonCard

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

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="skeleton h-5 w-1/3" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-40 w-full rounded-lg" />
    </div>
  )
}
