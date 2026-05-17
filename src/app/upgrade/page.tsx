import type { Metadata } from "next"
import UpgradeClient from "./UpgradeClient"

export const metadata: Metadata = {
  title: "Upgrade Plan — SendQuote",
  description: "Upgrade to Starter or Professional plan for unlimited quotes, custom branding, and priority support.",
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function UpgradePage() {
  return <UpgradeClient />
}