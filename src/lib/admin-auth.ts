import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase"

export async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")

    if (!sessionCookie?.value) {
      return false
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('admin_sessions')
      .select('id')
      .eq('token', sessionCookie.value)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return false
    }

    return true
  } catch {
    return false
  }
}
