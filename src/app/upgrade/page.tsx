import type { Metadata } from "next"
import UpgradeClient from "./UpgradeClient"

export const metadata: Metadata = {
  title: "Pricing & Plans",
  description: "Choose the right plan for your business. Free tier with 5 quotes/month, or upgrade to Starter (₹299/mo) for unlimited quotes, open tracking, and branded PDFs.",
}

export default function UpgradePage() {
  return <UpgradeClient />
}
