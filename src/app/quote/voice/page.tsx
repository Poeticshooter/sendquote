import type { Metadata } from "next"
import VoiceQuoteWizard from "./VoiceQuoteWizard"

export const metadata: Metadata = {
  title: "Create Quote by Voice — SendQuote",
  description: "Create professional quotes using just your voice. No typing required. Supports English, Hindi, Tamil, and more.",
}

export default function VoiceQuotePage() {
  return <VoiceQuoteWizard />
}
