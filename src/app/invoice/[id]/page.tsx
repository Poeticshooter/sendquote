import type { Metadata } from "next"
import InvoiceDetailClient from "./InvoiceDetailClient"

export const metadata: Metadata = {
  title: "Invoice Details",
  description: "View your invoice details, record payments, and track outstanding amounts. GST-ready invoices for Indian businesses.",
}

export default function InvoiceDetailPage() {
  return <InvoiceDetailClient />
}
