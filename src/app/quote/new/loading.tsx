export default function QuoteBuilderLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
        <div className="skeleton h-48 w-full rounded-xl" />
        <div className="skeleton h-64 w-full rounded-xl" />
        <div className="skeleton h-40 w-full rounded-xl" />
      </div>
    </div>
  )
}
