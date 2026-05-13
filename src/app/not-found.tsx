import Link from "next/link"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4">
      <div className="text-center animate-fade-in">
        <div className="text-7xl font-black text-indigo-600/10 mb-2">404</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
        <p className="text-sm text-slate-500 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
          >
            Go to Dashboard
          </Link>
          <a
            href="mailto:support@sendquote.in?subject=404 Report - Missing Page&body=URL: "
            className="bg-white text-slate-700 text-sm font-medium px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            Report Issue
          </a>
        </div>
      </div>
    </div>
  )
}
