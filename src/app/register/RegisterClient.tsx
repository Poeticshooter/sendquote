"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import BrandLogo from "@/components/brand-logo"

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 6) score += 1
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" }
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" }
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" }
  return { score, label: "Strong", color: "bg-emerald-500" }
}

export default function RegisterClient() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [referralError, setReferralError] = useState("")
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) setReferralCode(ref)
  }, [searchParams])

  const passwordStrength = password ? getPasswordStrength(password) : null

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!businessName.trim()) errors.business = "Business name is required"
    if (!email.trim()) errors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Please enter a valid email address"
    if (!password) errors.password = "Password is required"
    else if (password.length < 6) errors.password = "At least 6 characters"
    else if (!/[A-Z]/.test(password)) errors.password = "Add at least one uppercase letter"
    else if (!/[0-9]/.test(password)) errors.password = "Add at least one number"
    if (password && confirmPassword && password !== confirmPassword) errors.confirm = "Passwords don't match"
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedBusiness = businessName.trim()

    if (!validate()) return

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { business_name: trimmedBusiness } },
    })

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        setError("An account with this email already exists. Please sign in instead.")
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      try {
        if (data.session) {
          let referredBy: string | null = null

          if (referralCode.trim()) {
            const { data: referrer } = await supabase
              .from("profiles")
              .select("user_id")
              .eq("referral_code", referralCode.trim())
              .single()

            if (referrer) {
              referredBy = referrer.user_id
              await supabase.from("referrals").insert({
                referrer_id: referrer.user_id,
                referred_id: data.user.id,
                status: "pending",
              })
            } else {
              setReferralError("Invalid referral code")
            }
          }

          // The DB trigger (handle_new_user) should auto-create the profile.
          // If it didn't (trigger missing/failed), create it manually as fallback.
          if (referredBy) {
            // Check if profile exists
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", data.user.id)
              .single()

            if (existingProfile) {
              // Profile exists (trigger worked), just update referral
              const { error: profileError } = await supabase
                .from("profiles")
                .update({ referred_by: referredBy })
                .eq("id", data.user.id)

              if (profileError) {
                console.error("Profile update error:", profileError)
              }
            } else {
              // Profile missing (trigger didn't fire), create it
              const profileData: Record<string, unknown> = {
                id: data.user.id,
                user_id: data.user.id,
                business_name: trimmedBusiness,
                plan: "free",
                referred_by: referredBy,
              }
              const { error: profileError } = await supabase
                .from("profiles")
                .insert(profileData)

              if (profileError) {
                console.error("Profile insert error:", profileError)
                setError(`Database error: ${profileError.message}`)
                setLoading(false)
                return
              }
            }
          } else {
            // No referral — verify profile exists, create if missing
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", data.user.id)
              .single()

            if (!existingProfile) {
              const { error: profileError } = await supabase
                .from("profiles")
                .insert({
                  id: data.user.id,
                  user_id: data.user.id,
                  business_name: trimmedBusiness,
                  plan: "free",
                })

              if (profileError) {
                console.error("Profile insert error:", profileError)
                setError(`Database error: ${profileError.message}`)
                setLoading(false)
                return
              }
            }
          }
          
          router.push("/dashboard")
          router.refresh()
        } else {
          setError("Please check your email to verify your account before signing in.")
          setLoading(false)
        }
      } catch (err: any) {
        console.error("Registration error:", err)
        setError(err.message || "An error occurred during registration")
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4">
      <BrandLogo className="mb-8" />

      <div className="w-full max-w-sm animate-fade-in-scale">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
            <p className="text-sm text-slate-500 mt-1">Start sending professional quotes</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={e => { setBusinessName(e.target.value); setFieldErrors(prev => ({ ...prev, business: "" })) }}
                required
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 ${fieldErrors.business ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-200:ring-indigo-800 focus:border-indigo-300"}`}
                placeholder="Rajan Sharma Contractors"
              />
              {fieldErrors.business && <p className="text-xs text-red-500 mt-1">{fieldErrors.business}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: "" })) }}
                required
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 ${fieldErrors.email ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-200:ring-indigo-800 focus:border-indigo-300"}`}
                placeholder="you@example.com"
              />
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: "" })) }}
                required
                minLength={6}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 ${fieldErrors.password ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-200:ring-indigo-800 focus:border-indigo-300"}`}
                placeholder="Create a strong password"
              />
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= (passwordStrength?.score ?? 0) ? (passwordStrength?.color ?? '') : "bg-slate-200"}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength && passwordStrength.score === 4 ? "text-emerald-600" : passwordStrength && passwordStrength.score === 3 ? "text-yellow-600" : "text-red-500"}`}>
                    Password strength: {passwordStrength?.label}
                  </p>
                </div>
              )}
              {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(prev => ({ ...prev, confirm: "" })) }}
                required
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 ${fieldErrors.confirm ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-200:ring-indigo-800 focus:border-indigo-300"}`}
                placeholder="Repeat your password"
              />
              {fieldErrors.confirm && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirm}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Referral Code <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={referralCode}
                onChange={e => { setReferralCode(e.target.value); setReferralError("") }}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 ${referralError ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-200:ring-indigo-800 focus:border-indigo-300"}`}
                placeholder="Enter referral code"
              />
              {referralError && <p className="text-xs text-red-500 mt-1">{referralError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Creating account..." : "Create Free Account"}
            </button>

            <p className="text-xs text-slate-400 text-center">By signing up, you agree to our Terms and Privacy Policy.</p>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
