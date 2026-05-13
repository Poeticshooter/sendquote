import type { Metadata } from "next"
import SettingsClient from "./SettingsClient"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your SendQuote profile — upload your logo, set business details, GST number, and customize your account.",
}

export default function SettingsPage() {
  return <SettingsClient />
}
