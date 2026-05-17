import type { Metadata } from "next"
import ClientsClient from "./ClientsClient"

export const metadata: Metadata = {
  title: "Clients — SendQuote",
  description: "Manage your clients, view quote history, and track engagement.",
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function ClientsPage() {
  return <ClientsClient />
}