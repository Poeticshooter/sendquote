import type { Metadata } from "next"
import TemplateGallery from "@/components/template-gallery"

export const metadata: Metadata = {
  title: "Quote Templates — SendQuote",
  description: "Browse professional quote templates for contractors, freelancers, and small businesses in India.",
}

export const dynamic = 'force-dynamic'

export default function TemplatesPage() {
  return <TemplateGallery />
}