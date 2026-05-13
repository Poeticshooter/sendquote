"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/toast"
import { motion } from "framer-motion"

type Template = {
  id: string
  name: string
  description: string
  category: string
  items: { description: string; spec: string; quantity: number; unit: string; rate: number }[]
  discount: number
  discountType: string
  gstRate: number
}

export const DEFAULT_TEMPLATES: Template[] = [
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
  },
  {
    id: "t4",
    name: " GST Invoice Services",
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
  },
]

interface TemplateGalleryProps {
  onSelect?: (template: Template) => void
  showSaveOption?: boolean
}

export default function TemplateGallery({ onSelect, showSaveOption = true }: TemplateGalleryProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"default" | "saved">("default")
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([])

  const categories = [...new Set(DEFAULT_TEMPLATES.map(t => t.category))]

  function handleUseTemplate(template: Template) {
    onSelect?.(template)
  }

  function saveAsTemplate(name: string, items: any[], discount: number, discountType: string, gstRate: number) {
    const templates = JSON.parse(localStorage.getItem("quoteTemplates") || "[]")
    const newTemplate: Template = {
      id: "custom-" + Date.now(),
      name,
      description: "Custom template",
      category: "Custom",
      items,
      discount,
      discountType,
      gstRate,
    }
    templates.push(newTemplate)
    localStorage.setItem("quoteTemplates", JSON.stringify(templates))
    toast("Template saved!", "success")
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
            Saved
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
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group"
              onClick={() => handleUseTemplate(template)}
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
                <button className="text-xs text-indigo-600 font-medium hover:text-indigo-700">
                  Use Template →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-sm">No saved templates yet</p>
          <p className="text-xs text-slate-400 mt-1">Save templates from your quotes to use later</p>
        </div>
      )}
    </div>
  )
}