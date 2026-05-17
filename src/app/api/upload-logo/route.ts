import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { csrfProtected } from "@/lib/csrf"

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const csrf = csrfProtected(req)
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.message }, { status: csrf.status })
  }

  const formData = await req.formData()
  const file = formData.get("logo") as File | null
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 })
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png"
  if (!["png", "jpg", "jpeg", "webp"].includes(ext)) {
    return NextResponse.json({ error: "Invalid file type (png, jpg, webp only)" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = `logos/${user.id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(fileName, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(fileName)

  await supabase.from("profiles").update({ logo_url: publicUrl }).eq("user_id", user.id)

  return NextResponse.json({ url: publicUrl })
}
