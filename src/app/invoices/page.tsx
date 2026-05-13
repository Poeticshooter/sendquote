import type { Metadata } from "next"
import InvoicesClient from "./InvoicesClient"

export const metadata: Metadata = {
  title: "Invoices",
  description: "View and manage all your GST-ready invoices. Track payments and outstanding amounts for your Indian business.",
}

export default function InvoicesPage() {
  return <InvoicesClient />
}
