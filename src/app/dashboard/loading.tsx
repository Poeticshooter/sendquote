import { CardSkeleton, TableSkeleton } from "@/components/skeleton"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
        <TableSkeleton rows={8} />
      </div>
    </div>
  )
}
