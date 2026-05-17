"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/toast"
import { motion } from "framer-motion"

type TemplateItem = {
  description: string
  spec: string
  quantity: number
  unit: string
  rate: number
  amount: number
  sort_order: number
}

type Template = {
  id: string
  template_name: string
  client_name: string
  client_email: string
  client_phone: string
  client_address: string
  items: TemplateItem[]
  discount: number
  discount_type: string
  gst_rate: number
  notes: string
  terms: string
  payment_terms: string
  total: number
  created_at: string
}

type DefaultTemplate = {
  id: string
  name: string
  description: string
  category: string
  items: { description: string; spec: string; quantity: number; unit: string; rate: number }[]
  discount: number
  discountType: string
  gstRate: number
  notes?: string
  terms?: string
  paymentTerms?: string
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    id: "t1",
    name: "Web Development",
    description: "Complete website development package",
    category: "Technology",
    items: [
      { description: "UI/UX Design", spec: "Custom design with Figma", quantity: 1, unit: "lot", rate: 15000 },
      { description: "Frontend Development", spec: "React/Next.js", quantity: 1, unit: "lot", rate: 35000 },
      { description: "Backend Development", spec: "Node.js/Python API", quantity: 1, unit: "lot", rate: 25000 },
      { description: "Database Setup", spec: "PostgreSQL/MongoDB", quantity: 1, unit: "lot", rate: 8000 },
      { description: "Deployment & Testing", spec: "Vercel/AWS", quantity: 1, unit: "lot", rate: 7000 },
    ],
    discount: 10,
    discountType: "percentage",
    gstRate: 18,
    terms: "50% advance payment required. Balance on delivery.",
    paymentTerms: "Net 30",
  },
  {
    id: "t2",
    name: "Interior Design",
    description: "Full home/office interior proposal",
    category: "Construction",
    items: [
      { description: "3D Visualization", spec: "Photorealistic renders", quantity: 3, unit: "nos", rate: 8000 },
      { description: "Floor Plan Design", spec: "2D drawings with dimensions", quantity: 1, unit: "lot", rate: 12000 },
      { description: "Material Selection", spec: "Curated options", quantity: 1, unit: "lot", rate: 5000 },
      { description: "Furniture Layout", spec: "Space planning", quantity: 1, unit: "lot", rate: 6000 },
      { description: "Project Supervision", spec: "On-site visits", quantity: 4, unit: "days", rate: 2500 },
    ],
    discount: 5,
    discountType: "percentage",
    gstRate: 18,
    terms: "Material costs billed separately.",
    paymentTerms: "40% advance, 40% on completion, 20% after 30 days.",
  },
  {
    id: "t3",
    name: "Event Photography",
    description: "Complete event coverage package",
    category: "Services",
    items: [
      { description: "Pre-event Consultation", spec: "Planning call", quantity: 1, unit: "nos", rate: 1500 },
      { description: "Event Coverage", spec: "Full day, 2 photographers", quantity: 1, unit: "days", rate: 25000 },
      { description: "Photo Editing", spec: "Color correction & retouching", quantity: 200, unit: "nos", rate: 50 },
      { description: "Online Gallery", spec: "Password protected", quantity: 1, unit: "lot", rate: 3000 },
      { description: "Print Delivery", spec: "10x12 inch prints", quantity: 20, unit: "nos", rate: 200 },
    ],
    discount: 0,
    discountType: "percentage",
    gstRate: 18,
    paymentTerms: "Full payment within 7 days of event.",
  },
  {
    id: "t4",
    name: "GST Invoice Services",
    description: "Monthly accounting & GST filing",
    category: "Finance",
    items: [
      { description: "Monthly Bookkeeping", spec: "Recording all transactions", quantity: 1, unit: "months", rate: 5000 },
      { description: "GST Return Filing", spec: "Monthly GSTR-1 & GSTR-3B", quantity: 1, unit: "months", rate: 2500 },
      { description: "Tax Consultation", spec: "Advisory calls", quantity: 2, unit: "nos", rate: 1500 },
      { description: "Annual Return", spec: "GSTR-9 preparation", quantity: 1, unit: "years", rate: 8000 },
      { description: "TDS Compliance", spec: "Quarterly returns", quantity: 1, unit: "quarters", rate: 3000 },
    ],
    discount: 15,
    discountType: "percentage",
    gstRate: 18,
    terms: "Documents must be submitted by 5th of each month.",
    paymentTerms: "Monthly advance payment.",
  },
  {
    id: "t5",
    name: "AC Repair & Service",
    description: "Annual AC maintenance contract",
    category: "Maintenance",
    items: [
      { description: "Split AC Servicing", spec: "Deep cleaning", quantity: 2, unit: "nos", rate: 1500 },
      { description: "Window AC Servicing", spec: "Deep cleaning", quantity: 1, unit: "nos", rate: 1200 },
      { description: "Gas Refilling", spec: "If required", quantity: 1, unit: "kg", rate: 600 },
      { description: "Annual Maintenance Contract", spec: "3 visits per year", quantity: 1, unit: "years", rate: 4000 },
      { description: "Emergency Service", spec: "24/7 support", quantity: 2, unit: "calls", rate: 500 },
    ],
    discount: 8,
    discountType: "percentage",
    gstRate: 18,
    paymentTerms: "Pay per visit or annual lump sum.",
  },
]

export default function TemplateGallery() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"default" | "saved">("default")
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSavedTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSavedTemplates() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from("quotes")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_template", true)
      .order("created_at", { ascending: false })

    if (data) {
      const templatesWithItems: Template[] = []
      for (const q of data) {
        const { data: items } = await supabase
          .from("quote_items")
          .select("*")
          .eq("quote_id", q.id)
          .order("sort_order")

        templatesWithItems.push({
          id: q.id,
          template_name: q.template_name || q.client_name || "Untitled",
          client_name: q.client_name,
          client_email: q.client_email,
          client_phone: q.client_phone,
          client_address: q.client_address,
          items: items || [],
          discount: Number(q.discount),
          discount_type: q.discount_type,
          gst_rate: Number(q.gst_rate),
          notes: q.notes || "",
          terms: q.terms || "",
          payment_terms: q.payment_terms || "",
          total: Number(q.total),
          created_at: q.created_at,
        })
      }
      setSavedTemplates(templatesWithItems)
    }
    setLoading(false)
  }

  function applyDefaultTemplate(template: DefaultTemplate) {
    const params = new URLSearchParams({
      template: "default",
      templateId: template.id,
    })
    router.push(`/quote/new?${params.toString()}`)
  }

  function applySavedTemplate(template: Template) {
    const params = new URLSearchParams({
      template: "saved",
      templateId: template.id,
    })
    router.push(`/quote/new?${params.toString()}`)
  }

  async function deleteTemplate(templateId: string) {
    if (!confirm("Delete this template?")) return
    await supabase.from("quotes").update({ is_template: false }).eq("id", templateId)
    toast("Template deleted", "success")
    loadSavedTemplates()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Quote Templates</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("default")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "default" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Default
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "saved" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Saved ({savedTemplates.length})
          </button>
        </div>
      </div>

      {activeTab === "default" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEFAULT_TEMPLATES.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group"
              onClick={() => applyDefaultTemplate(template)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {template.category}
                </span>
              </div>

              <div className="space-y-1.5 mb-4">
                {template.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-600 truncate max-w-[60%]">{item.description}</span>
                    <span className="text-slate-900 font-medium">₹{item.rate.toLocaleString()}</span>
                  </div>
                ))}
                {template.items.length > 3 && (
                  <p className="text-xs text-slate-400">+{template.items.length - 3} more items</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-sm font-bold text-indigo-600">
                  ₹{template.items.reduce((s, i) => s + i.rate * i.quantity, 0).toLocaleString()}
                </span>
                <span className="text-xs text-indigo-600 font-medium">
                  Use Template →
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <p>Loading templates...</p>
            </div>
          ) : savedTemplates.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-sm">No saved templates yet</p>
              <p className="text-xs text-slate-400 mt-1">Open a quote and click &quot;Save as Template&quot; to reuse it</p>
            </div>
          ) : (
            savedTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-indigo-200 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => applySavedTemplate(template)}>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{template.template_name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                        ₹{template.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      {template.client_name && <span>Client: {template.client_name}</span>}
                      <span>{template.items.length} items</span>
                      {template.discount > 0 && <span>{template.discount}% discount</span>}
                      <span>GST {template.gst_rate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => applySavedTemplate(template)}
                      className="text-xs text-indigo-600 font-medium hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      Use →
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete template"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
