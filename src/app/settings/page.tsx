import type { Metadata } from "next"
import SettingsClient from "./SettingsClient"

export const metadata: Metadata = {
  title: "Settings — SendQuote",
  description: "Manage your business profile, SMTP settings, and preferences.",
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  return <SettingsClient />
}