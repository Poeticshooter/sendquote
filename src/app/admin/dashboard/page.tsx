import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import AdminDashboardClient from "./AdminDashboardClient"

export const metadata: Metadata = {
  title: "Admin Dashboard — SendQuote",
  description: "Admin panel for monitoring SendQuote platform metrics.",
  robots: { index: false, follow: false },
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    redirect("/admin/login")
  }

  return <AdminDashboardClient />
}
