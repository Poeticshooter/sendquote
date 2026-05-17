import type { Metadata } from "next"
import { Suspense } from "react"
import QuoteWizard from "@/components/quote-wizard"
import ErrorBoundary from "@/components/error-boundary"

export const metadata: Metadata = {
  title: "Create New Quote — SendQuote",
  description: "Create a professional GST-ready quote in minutes.",
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

function WizardWrapper() {
  return <QuoteWizard mode="create" />
}

export default function NewQuotePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-500">Loading...</p></div>}>
        <WizardWrapper />
      </Suspense>
    </ErrorBoundary>
  )
}
