"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import ThemeToggle from "@/components/theme-toggle"

declare global {
  interface Window { Razorpay: any }
}

interface Plan {
  name: string
  priceMonthly: number
  features: string[]
  current?: boolean
  priceId: string
  popular?: boolean
  cta: string
}

const plans: Plan[] = [
  {
    name: "Free",
    priceMonthly: 0,
    features: ["5 quotes/month", "Basic quote builder", "Shareable link", "PDF download", "Client history", "Email support"],
    current: true,
    priceId: "free",
    cta: "Current Plan",
  },
  {
    name: "Starter",
    priceMonthly: 299,
    popular: true,
    features: ["Unlimited quotes", "Open tracking", "Branded PDF with logo", "Client accept online", "WhatsApp sharing", "Smart follow-ups", "GST invoices", "Client history", "Priority support", "Webhook integrations"],
    cta: "Upgrade Now",
    priceId: "starter_monthly",
  },
  {
    name: "Professional",
    priceMonthly: 799,
    features: ["Everything in Starter", "Up to 5 team members", "Custom branding", "Analytics dashboard", "Bulk CSV export", "API access", "CRM integrations", "Dedicated support"],
    cta: "Contact Sales",
    priceId: "professional",
  },
  {
    name: "Enterprise",
    priceMonthly: 2499,
    features: ["Everything in Professional", "Unlimited team members", "Custom domain", "White-label", "Advanced analytics", "Priority queue", "Dedicated account manager", "Custom integrations"],
    cta: "Contact Sales",
    priceId: "enterprise",
  },
]

const GST_RATE = 18
const ANNUAL_DISCOUNT = 10

function calculatePrice(monthlyPrice: number, isAnnual: boolean) {
  if (monthlyPrice === 0) return { base: 0, discount: 0, subtotal: 0, gst: 0, total: 0 }
  
  let base = isAnnual ? monthlyPrice * 12 : monthlyPrice
  let discount = isAnnual ? (base * ANNUAL_DISCOUNT) / 100 : 0
  let subtotal = base - discount
  let gst = (subtotal * GST_RATE) / 100
  let total = subtotal + gst
  
  return { base, discount, subtotal, gst, total }
}

export default function UpgradeClient() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentPlan, setCurrentPlan] = useState("free")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")

  useEffect(() => {
    supabase.from("profiles").select("plan").single().then(({ data }) => {
      if (data?.plan) setCurrentPlan(data.plan)
    })
  }, [supabase])

  async function handleUpgrade(planId: string, price: number) {
    if (price === 0) return
    
    if (planId === "professional" || planId === "enterprise") {
      const link = document.createElement('a')
      link.href = "mailto:support@sendquote.in?subject=" + encodeURIComponent(`Interest in ${planId} plan`)
      link.click()
      return
    }

    setLoading(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Not authenticated"); setLoading(false); return }

    const { base, discount, gst, total } = calculatePrice(price, billingCycle === "annual")

    const res = await fetch("/api/create-razorpay-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        planType: planId,
        billingCycle: billingCycle,
        basePrice: base,
        discount: discount,
        gst: gst,
        total: total
      }),
    })

    const order = await res.json()
    if (!res.ok || order.error) {
      setError(order.error || "Failed to create order")
      setLoading(false)
      return
    }

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "SendQuote",
        description: billingCycle === "annual" ? "Annual Subscription" : "Monthly Subscription",
        order_id: order.id,
        prefill: { contact: "", email: user.email },
        handler: async function (response: any) {
          await fetch("/api/create-razorpay-order", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              planType: planId,
              billingCycle: billingCycle,
            }),
          })
          router.push("/settings?upgraded=true")
          router.refresh()
        },
        modal: { ondismiss: () => setLoading(false) },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    }
    script.onerror = () => { setError("Failed to load payment gateway"); setLoading(false) }
    document.body.appendChild(script)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-900 tracking-tight">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#4F46E5" />
              <path d="M10 10h12M10 16h8M10 22h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M22 18l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            SendQuote
          </Link>
          <span className="text-sm text-slate-500">Plans & Pricing</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-medium px-4 py-1.5 rounded-full mb-4 shadow-sm">
            Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Choose the right plan for you</h1>
          <p className="text-slate-500 mt-2">All plans include a 7-day free trial. No credit card required.</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full p-1.5 border border-slate-200 shadow-sm flex">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                billingCycle === "annual"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Annual
              <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">Save 10%</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 mb-6">{error}</div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isCurrent = plan.name.toLowerCase() === currentPlan
            const pricing = calculatePrice(plan.priceMonthly, billingCycle === "annual")
            const isPopular = plan.popular

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 border-2 transition-all hover:shadow-xl ${
                  isPopular
                    ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-sm whitespace-nowrap">
                    BEST VALUE
                  </div>
                )}

                <h3 className={`text-lg font-bold ${isPopular ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>

                <div className="mt-4">
                  {plan.priceMonthly === 0 ? (
                    <div className={`text-3xl font-black ${isPopular ? "text-white" : "text-slate-900"}`}>Free</div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-black ${isPopular ? "text-white" : "text-slate-900"}`}>₹{Math.round(pricing.total)}</span>
                        <span className={`text-sm ${isPopular ? "text-indigo-200" : "text-slate-400"}`}>
                          /{billingCycle === "annual" ? "year" : "month"}
                        </span>
                      </div>
                      {billingCycle === "annual" && pricing.discount > 0 && (
                        <div className="text-xs text-emerald-600 font-medium mt-1">
                          Save ₹{Math.round(pricing.discount)} ({ANNUAL_DISCOUNT}% off)
                        </div>
                      )}
                    </>
                  )}
                </div>

                <ul className={`mt-5 space-y-2 text-sm ${isPopular ? "text-indigo-100" : "text-slate-600"}`}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <svg className={`w-5 h-5 shrink-0 mt-0.5 ${isPopular ? "text-white" : "text-indigo-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="mt-6 block w-full text-center py-2.5 rounded-xl font-semibold text-sm bg-slate-100 text-slate-400 cursor-default">
                    Current Plan
                  </div>
                ) : plan.priceMonthly === 0 ? null : (
                  <button
                    onClick={() => handleUpgrade(plan.priceId, plan.priceMonthly)}
                    disabled={loading}
                    className={`mt-6 block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 ${
                      isPopular
                        ? "bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                    }`}
                  >
                    {loading ? "Processing..." : plan.cta}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-6 max-w-2xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-amber-800">Why is there an additional charge?</h4>
              <p className="text-sm text-amber-700 mt-1">
                All subscription plans include <strong>18% GST</strong> as per Indian government regulations. 
                This tax is automatically added to your payment and is remitted to the government on your behalf.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl p-6 border border-slate-200 text-center max-w-xl mx-auto shadow-sm">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900 flex items-center gap-1.5 justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h8.25a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg> 7-day money-back guarantee.
            </span>{" "}
            If SendQuote doesn&apos;t help you close more deals, we&apos;ll refund every rupee.
          </p>
        </div>

        <div className="text-center mt-10">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">← Back to Dashboard</Link>
        </div>
      </main>
    </div>
  )
}