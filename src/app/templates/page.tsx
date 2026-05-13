import { Metadata } from "next"
import TemplateGallery from "@/components/template-gallery"

export const dynamic = 'force-dynamic'

export default function TemplatesPage() {
  return <TemplateGallery />
}

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Quote Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Start with a professional template and customize for your client</p>
        </div>
        
        <TemplateGallery />
      </div>
    </div>
  )
}