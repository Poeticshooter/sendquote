import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import AdminDashboardClient from "./AdminDashboardClient"

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    redirect("/admin/login")
  }

  return <AdminDashboardClient />
}
