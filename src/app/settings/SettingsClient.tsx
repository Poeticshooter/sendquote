"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/toast"
import { useTranslation } from "@/lib/i18n"
import BrandLogo from "@/components/brand-logo"
import { CSRF_COOKIE_NAME_LOCAL, CSRF_HEADER_NAME_LOCAL } from "@/lib/csrf"

export default function SettingsClient() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const { language, setLanguage } = useTranslation()

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
  const [smtpEmail, setSmtpEmail] = useState("")
  const [smtpAppPassword, setSmtpAppPassword] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [voiceLang, setVoiceLang] = useState("en-IN")
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [ttsRate, setTtsRate] = useState(1.0)
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
      setSmtpEmail(prof.smtp_email || "")
      setSmtpAppPassword(prof.smtp_app_password ? '••••••••••••' : "")
      setReferralCode(prof.referral_code || "")
      if (prof.preferred_language) {
        setLanguage(prof.preferred_language)
      }
      if (prof.voice_language) {
        setVoiceLang(prof.voice_language)
      }
      if (prof.voice_enabled !== null && prof.voice_enabled !== undefined) {
        setVoiceEnabled(prof.voice_enabled)
      }
      if (prof.tts_rate) {
        setTtsRate(prof.tts_rate)
      }
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
  }, [supabase, router, setLanguage])

  loadRef.current = loadProfile
  useEffect(() => { loadRef.current?.() }, [])

  async function handleLogoUpload(file: File) {
    setUploading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const formData = new FormData()
    formData.append("logo", file)
    const csrfToken = document.cookie.split('; ').find(r => r.startsWith(CSRF_COOKIE_NAME_LOCAL + '='))?.split('=')[1]
    const res = await fetch("/api/upload-logo", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(csrfToken ? { [CSRF_HEADER_NAME_LOCAL]: csrfToken } : {}),
      },
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

    const profileUpdate: Record<string, unknown> = {
      business_name: businessName,
      phone,
      gst_number: gstNumber,
      address,
      smtp_email: smtpEmail,
    }

    if (smtpAppPassword && smtpAppPassword !== '••••••••••••') {
      const { encrypt } = await import('@/lib/encryption')
      profileUpdate.smtp_app_password = encrypt(smtpAppPassword)
    }

    profileUpdate.voice_language = voiceLang
    profileUpdate.voice_enabled = voiceEnabled
    profileUpdate.tts_rate = ttsRate

    const { error } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", user.id)

    if (error) toast(error.message, "error")
    else toast("Settings saved!", "success")
    setSaving(false)
  }

  async function handleLanguageChange(lang: string) {
    setLanguage(lang)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("profiles").update({ preferred_language: lang }).eq("user_id", user.id)
    }
  }

  async function handleVoiceLangChange(lang: string) {
    setVoiceLang(lang)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("profiles").update({ voice_language: lang }).eq("user_id", user.id)
    }
    toast("Voice language updated", "success")
  }

  async function handleVoiceEnabledChange(enabled: boolean) {
    setVoiceEnabled(enabled)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("profiles").update({ voice_enabled: enabled }).eq("user_id", user.id)
    }
    toast(enabled ? "Voice assistant enabled" : "Voice assistant disabled", "success")
  }

  async function handleTtsRateChange(rate: number) {
    setTtsRate(rate)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("profiles").update({ tts_rate: rate }).eq("user_id", user.id)
    }
  }

  function copyReferralCode() {
    const shareUrl = `${window.location.origin}/register?ref=${referralCode}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      toast("Referral link copied!", "success")
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleLogout() {
    if (!confirm("Are you sure you want to sign out? Your current work is saved automatically.")) return
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-3">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo href="/dashboard" className="h-6" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Settings</span>
          </div>
          <button onClick={handleLogout} className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Sign out">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
        {/* Plan card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Plan & Usage</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              ["Plan", <span key="p" className={`font-medium capitalize ${plan === "free" ? "text-amber-700" : "text-emerald-700"}`}>{plan}</span>],
              ["Email", <span key="e" className="font-medium text-slate-900 dark:text-white">{email}</span>],
              ["Total Quotes", <span key="t" className="font-medium text-slate-900 dark:text-white">{totalQuotes}</span>],
              ["This Month", <span key="m" className="font-medium text-slate-900 dark:text-white">{monthCount}{plan === "free" ? " / 5" : " (unlimited)"}</span>],
              ...(planExpiry ? [["Expires", <span key="ex" className="font-medium text-slate-900 dark:text-white">{new Date(planExpiry).toLocaleDateString("en-IN")}</span>]] : []),
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">{label as string}</p>
                <div className="mt-1">{value}</div>
              </div>
            ))}
          </div>
          {plan === "free" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/upgrade" className="inline-flex bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
                Upgrade to Starter — ₹299/month
              </Link>
              <Link href="/upgrade" className="inline-flex bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-400 text-sm font-medium px-5 py-2 rounded-lg border border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all">
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

        {/* Referral */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Refer a Friend</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Your Referral Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 dark:text-slate-300">
                  {referralCode || "Loading..."}
                </code>
                <button
                  type="button"
                  onClick={copyReferralCode}
                  disabled={!referralCode}
                  className="shrink-0 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                  aria-label="Copy referral link"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Share this link</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 break-all bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                {typeof window !== "undefined" ? `${window.location.origin}/register?ref=${referralCode}` : ""}
              </p>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">When someone signs up using your link and upgrades to a paid plan, your plan gets extended by 30 days.</p>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Language</h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleLanguageChange("en")}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                language === "en"
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange("hi")}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                language === "hi"
                  ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>

        {/* Voice Assistant */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Voice Assistant</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Voice Recognition Language</label>
              <select
                value={voiceLang}
                onChange={e => handleVoiceLangChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 text-sm"
              >
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">हिंदी (Hindi)</option>
                <option value="ta-IN">தமிழ் (Tamil)</option>
                <option value="te-IN">తెలుగు (Telugu)</option>
                <option value="mr-IN">मराठी (Marathi)</option>
                <option value="gu-IN">ગુજરાતી (Gujarati)</option>
                <option value="bn-IN">বাংলা (Bengali)</option>
                <option value="kn-IN">ಕನ್ನಡ (Kannada)</option>
                <option value="ml-IN">മലയാളം (Malayalam)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable Voice Assistant</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Show the voice assistant button on all pages</p>
                </div>
              <button
                type="button"
                onClick={() => handleVoiceEnabledChange(!voiceEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${voiceEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                role="switch"
                aria-checked={voiceEnabled}
                aria-label="Toggle voice assistant"
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${voiceEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Speech Speed</label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={ttsRate}
                onChange={e => handleTtsRateChange(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                <span>Slow</span>
                <span>{ttsRate.toFixed(1)}x</span>
                <span>Fast</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 space-y-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Business Profile</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 -mt-3">This information appears on your quotes.</p>

          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Business Logo</label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative group">
                  <Image src={logoUrl} alt="Logo" width={64} height={64} className="w-16 h-16 object-contain rounded-lg border border-slate-200 dark:border-slate-700" />
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-xs font-medium">
                    Change
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors flex items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-800">
                  <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
              )}
              <div className="text-xs text-slate-400 dark:text-slate-500">
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Business Name</label>
            <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800" placeholder="Your Business Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800" placeholder="98765 43210" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">GST Number</label>
            <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800" placeholder="22AAAAA0000A1Z5 (optional)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 resize-none" placeholder="Business address" />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Settings</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              {plan === "free"
                ? "Free plan: Add your Gmail app password to send emails from your own address. Get one at myaccount.google.com/apppasswords"
                : "Paid plan: Emails are sent via SendQuote. Optional: add your own Gmail for branded sending."}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Gmail Address</label>
                <input type="email" value={smtpEmail} onChange={e => setSmtpEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800" placeholder="you@gmail.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Gmail App Password</label>
                <input type="password" value={smtpAppPassword} onChange={e => setSmtpAppPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800" placeholder="xxxx xxxx xxxx xxxx" />
              </div>
            </div>
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
