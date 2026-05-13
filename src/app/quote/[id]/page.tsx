import type { Metadata } from "next"
import QuoteDetailClient from "./QuoteDetailClient"

export const metadata: Metadata = {
  title: "Quote Details",
  description: "View and manage your quote. Track client opens, share via WhatsApp, and convert accepted quotes to invoices.",
}

export default function QuoteDetailPage() {
  return <QuoteDetailClient />
}
