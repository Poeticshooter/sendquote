export default function QuoteDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="skeleton h-6 w-8 rounded" />
          <div className="skeleton h-5 w-20 rounded" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="skeleton h-48 w-full rounded-2xl" />
        <div className="skeleton h-24 w-full rounded-xl" />
      </div>
    </div>
  )
}