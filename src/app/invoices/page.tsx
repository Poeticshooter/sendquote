import type { Metadata } from "next"
import InvoicesClient from "./InvoicesClient"

export const metadata: Metadata = {
  title: "Invoices — SendQuote",
  description: "Create and manage GST invoices, track payments, and send reminders.",
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function InvoicesPage() {
  return <InvoicesClient />
}