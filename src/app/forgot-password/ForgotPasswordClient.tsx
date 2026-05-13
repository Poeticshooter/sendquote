"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/toast"
import BrandLogo from "@/components/brand-logo"

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()
  const { toast } = useToast()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!email.trim()) { setError("Email is required"); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    if (err) { setError(err.message); toast(err.message, "error") }
    else { setSent(true); toast("Reset link sent!", "success") }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4">
        <BrandLogo className="mb-8" />
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Check your email</h1>
          <p className="text-sm text-slate-500">We sent a password reset link to <strong className="text-slate-700">{email}</strong></p>
          <Link href="/login" className="mt-6 inline-block text-sm text-indigo-600 font-medium hover:text-indigo-700">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4">
      <BrandLogo className="mb-8" />
      <div className="w-full max-w-sm animate-fade-in-scale">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Reset password</h1>
          <p className="text-sm text-slate-500 mb-6">Enter your email and we&apos;ll send you a reset link.</p>
          <form onSubmit={handleReset} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="input-field" placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-all disabled:opacity-50">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
