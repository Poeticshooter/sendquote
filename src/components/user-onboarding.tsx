"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/toast"
import { CSRF_COOKIE_NAME_LOCAL, CSRF_HEADER_NAME_LOCAL } from "@/lib/csrf"

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to SendQuote",
    subtitle: "Let's set up your business profile in under 60 seconds",
  },
  {
    id: "basics",
    title: "Business Details",
    subtitle: "This appears on your quotes and invoices",
  },
  {
    id: "complete",
    title: "You're All Set!",
    subtitle: "Start creating professional quotes",
  },
]

const VALUE_PROPS = [
  { icon: "📄", title: "Professional Quotes", desc: "Branded PDFs with your logo" },
  { icon: "📱", title: "WhatsApp Sharing", desc: "Send quotes instantly via WhatsApp" },
  { icon: "👀", title: "Open Tracking", desc: "Know when clients view your quotes" },
  { icon: "💳", title: "Invoice Generation", desc: "Convert quotes to invoices" },
]

export default function UserOnboarding() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [phone, setPhone] = useState("")
  const [gstNumber, setGstNumber] = useState("")
  const [address, setAddress] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  async function checkProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("business_name, phone, gst_number, address, logo_url")
      .eq("user_id", user.id)
      .single()

    if (!prof?.business_name) {
      setIsOpen(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    checkProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    if (res.ok) {
      setLogoUrl(json.url)
      toast("Logo uploaded!", "success")
    } else {
      toast(json.error || "Upload failed", "error")
    }
    setUploading(false)
  }

  async function handleNext() {
    if (step === 0) {
      setStep(1)
    } else if (step === 1) {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("profiles")
        .update({ 
          business_name: businessName, 
          phone, 
          gst_number: gstNumber, 
          address,
          logo_url: logoUrl 
        })
        .eq("user_id", user.id)

      if (error) {
        toast(error.message, "error")
        setSaving(false)
        return
      }

      setStep(2)
      setSaving(false)
    } else {
      setIsOpen(false)
      router.refresh()
    }
  }

  function handleSkip() {
    setIsOpen(false)
    router.refresh()
  }

  if (loading || !isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-scale">
        {step < 2 && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: step === 0 ? "33%" : "66%" }}
            />
          </div>
        )}

        {step === 0 && (
          <div className="p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.2" />
                <path d="M10 10h12M10 16h8M10 22h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M22 18l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
              {STEPS[step].title}
            </h2>
            <p className="text-sm text-slate-500 text-center mb-8">
              {STEPS[step].subtitle}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {VALUE_PROPS.map((prop, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3.5 text-left">
                  <span className="text-lg mb-1.5 block">{prop.icon}</span>
                  <p className="text-sm font-semibold text-slate-800">{prop.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{prop.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleSkip}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Skip for now
              </button>
              <button 
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Let&apos;s go →
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {STEPS[step].title}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {STEPS[step].subtitle}
                </p>
              </div>
              <button onClick={handleSkip} className="text-xs text-slate-400 hover:text-slate-600">
                Skip
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  placeholder="Your Business Name"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                    placeholder="98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={e => setGstNumber(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Business Address
                </label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none"
                  placeholder="Your business address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Logo (optional)
                </label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <div className="relative">
                      <Image src={logoUrl} alt="Logo" width={48} height={48} className="w-12 h-12 object-contain rounded-lg border border-slate-200" />
                      <button
                        onClick={() => setLogoUrl("")}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => document.getElementById("onboarding-logo")?.click()}
                      className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </button>
                  )}
                  <input
                    id="onboarding-logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleLogoUpload(file)
                    }}
                  />
                  <span className="text-xs text-slate-400">PNG, JPG or WebP</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleSkip}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Skip
              </button>
              <button 
                onClick={handleNext}
                disabled={!businessName.trim() || saving}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save & Continue"
                )}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {STEPS[step].title}
            </h2>
            <p className="text-sm text-slate-500 mb-8">
              {STEPS[step].subtitle}
            </p>

            <div className="bg-slate-50 rounded-xl p-5 mb-6 text-left">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">What&apos;s included with your account</p>
              <div className="grid grid-cols-2 gap-3">
                {VALUE_PROPS.map((prop, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-lg">{prop.icon}</span>
                    <span className="text-sm text-slate-700">{prop.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleNext}
                className="w-full py-3 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Create Your First Quote →
              </button>
              <button 
                onClick={() => { setIsOpen(false); router.push("/dashboard") }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}