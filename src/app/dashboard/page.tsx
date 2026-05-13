import type { Metadata } from "next"
import DashboardClient from "./DashboardClient"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your quotes, track client activity, and view your business performance. See open rates, acceptance rates, and outstanding amounts at a glance.",
}

export default function DashboardPage() {
  return <DashboardClient />
}
