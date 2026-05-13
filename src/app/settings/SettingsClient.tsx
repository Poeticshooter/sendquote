"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/toast"
import BrandLogo from "@/components/brand-logo"
import ThemeToggle from "@/components/theme-toggle"

export default function SettingsClient() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [businessName, setBusinessName] = useState("")
  const [phone, setPhone] = useState("")
  const [gstNumber, setGstNumber] = useState("")
  const [address, setAddress] = useState("")
  const [plan, setPlan] = useState("free")
  const [planExpiry, setPlanExpiry] = useState("")
  const [email, setEmail] = useState("")
  const [monthCount, setMonthCount] = useState(0)
  const [totalQuotes, setTotalQuotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const loadRef = useRef<(() => void) | null>(null)

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }
    setEmail(user.email || "")

    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (prof) {
      setBusinessName(prof.business_name || "")
      setPhone(prof.phone || "")
      setGstNumber(prof.gst_number || "")
      setAddress(prof.address || "")
      setPlan(prof.plan || "free")
      setPlanExpiry(prof.plan_expiry || "")
      setLogoUrl(prof.logo_url || "")
    }

    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const { count: mc } = await supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart.toISOString())
    setMonthCount(mc || 0)

    const { count: tc } = await supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
setTotalQuotes(tc || 0)
    setLoading(false)
  }, [supabase, router])

  loadRef.current = loadProfile
  useEffect(() => { loadRef.current?.() }, [])

  async function handleLogoUpload(file: File) {
    setUploading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const formData = new FormData()
    formData.append("logo", file)
    const res = await fetch("/api/upload-logo", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: formData,
    })
    const json = await res.json()
    if (res.ok) { setLogoUrl(json.url); toast("Logo uploaded!", "success") }
    else toast(json.error || "Upload failed", "error")
    setUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from("profiles")
      .update({ business_name: businessName, phone, gst_number: gstNumber, address })
      .eq("user_id", user.id)

    if (error) toast(error.message, "error")
    else toast("Settings saved!", "success")
    setSaving(false)
  }

  async function handleLogout() {
    if (!confirm("Are you sure you want to sign out? Your current work is saved automatically.")) return
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="skeleton h-8 w-48" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo href="/dashboard" className="h-6" />
            <span className="text-sm text-slate-500">Settings</span>
          </div>
          <ThemeToggle />
          <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
        {/* Plan card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Plan & Usage</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              ["Plan", <span key="p" className={`font-medium capitalize ${plan === "free" ? "text-amber-700" : "text-emerald-700"}`}>{plan}</span>],
              ["Email", <span key="e" className="font-medium text-slate-900">{email}</span>],
              ["Total Quotes", <span key="t" className="font-medium text-slate-900">{totalQuotes}</span>],
              ["This Month", <span key="m" className="font-medium text-slate-900">{monthCount}{plan === "free" ? " / 5" : " (unlimited)"}</span>],
              ...(planExpiry ? [["Expires", <span key="ex" className="font-medium text-slate-900">{new Date(planExpiry).toLocaleDateString("en-IN")}</span>]] : []),
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-slate-500 text-xs uppercase tracking-wide">{label as string}</p>
                <div className="mt-1">{value}</div>
              </div>
            ))}
          </div>
          {plan === "free" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/upgrade" className="inline-flex bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
                Upgrade to Starter — ₹299/month
              </Link>
              <Link href="/upgrade" className="inline-flex bg-white text-violet-700 text-sm font-medium px-5 py-2 rounded-lg border border-violet-200 hover:bg-violet-50 transition-all">
                View Professional — ₹799/month
              </Link>
            </div>
          )}
          {plan === "starter" && (
            <Link href="/upgrade" className="mt-4 inline-flex text-sm font-medium text-violet-700 hover:text-violet-800 transition-colors">
              Compare Professional plan →
            </Link>
          )}
        </div>

        {/* Profile form */}
        <form onSubmit={handleSave} className="bg-white rounded-xl p-6 border border-slate-200 space-y-5">
          <h2 className="text-lg font-bold text-slate-900">Business Profile</h2>
          <p className="text-sm text-slate-500 -mt-3">This information appears on your quotes.</p>

          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Business Logo</label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative group">
                  <Image src={logoUrl} alt="Logo" width={64} height={64} className="w-16 h-16 object-contain rounded-lg border border-slate-200" />
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-xs font-medium">
                    Change
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-colors flex items-center justify-center cursor-pointer bg-slate-50">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
              )}
              <div className="text-xs text-slate-400">
                <p>PNG, JPG or WebP</p>
                <p>Max 2MB</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleLogoUpload(file)
              }}
            />
            {uploading && <p className="text-xs text-indigo-600 mt-2">Uploading...</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Name</label>
            <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
              className="input-field" placeholder="Your Business Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="input-field" placeholder="98765 43210" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">GST Number</label>
            <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)}
              className="input-field" placeholder="22AAAAA0000A1Z5 (optional)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2}
              className="input-field" placeholder="Business address" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-all disabled:opacity-50">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </main>
    </div>
  )
}
