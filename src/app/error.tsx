"use client"

import Link from "next/link"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const errorId = error.digest ? `Error ID: ${error.digest.slice(0, 8)}` : ""

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4">
      <div className="text-center animate-fade-in max-w-sm">
        <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-500 mb-4">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        {errorId && <p className="text-xs text-slate-400 mb-6 font-mono">{errorId}</p>}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="bg-white text-slate-700 text-sm font-medium px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Still having issues?{" "}
          <a href="mailto:support@sendquote.in?subject=Error Report - Page Issue&body=Please describe what you were doing when this error occurred:" className="text-indigo-600 hover:underline">
            Report this issue
          </a>
        </p>
      </div>
    </div>
  )
}
