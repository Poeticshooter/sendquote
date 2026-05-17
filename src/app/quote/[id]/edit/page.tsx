"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import QuoteWizard from "@/components/quote-wizard"

type LineItem = {
  id: string
  description: string
  spec: string
  quantity: number
  unit: string
  rate: number
  amount: number
}

export default function EditQuotePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [initialData, setInitialData] = useState<{
    client_name: string
    client_phone: string
    client_email: string
    client_address: string
    validTill: string
    paymentTerms: string
    items: LineItem[]
    discount: number
    discountType: "percentage" | "fixed"
    gstRate: number
    notes: string
    terms: string
  } | null>(null)

  useEffect(() => {
    async function loadQuote() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      
      const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).eq("user_id", user.id).single()
      if (!quote) { router.push("/dashboard"); return }
      if (quote.status !== "draft") { router.push(`/quote/${id}`); return }

      const { data: itemRows } = await supabase.from("quote_items").select("*").eq("quote_id", id).order("sort_order")
      
      setInitialData({
        client_name: quote.client_name,
        client_phone: quote.client_phone || "",
        client_email: quote.client_email || "",
        client_address: quote.client_address || "",
        validTill: quote.valid_until || "",
        paymentTerms: quote.payment_terms || "",
        items: (itemRows || []).map((row: any) => ({
          id: row.id,
          description: row.description,
          spec: row.spec || "",
          quantity: row.quantity,
          unit: row.unit,
          rate: row.rate,
          amount: row.amount,
        })),
        discount: Number(quote.discount) || 0,
        discountType: (quote.discount_type as "percentage" | "fixed") || "percentage",
        gstRate: Number(quote.gst_rate) || 0,
        notes: quote.notes || "",
        terms: quote.terms || "",
      })
      setLoading(false)
    }
    loadQuote()
  }, [id, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="skeleton h-8 w-48" />
      </div>
    )
  }

  if (!initialData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading quote...</p>
      </div>
    )
  }

  return <QuoteWizard initialData={initialData} quoteId={id} mode="edit" />
}