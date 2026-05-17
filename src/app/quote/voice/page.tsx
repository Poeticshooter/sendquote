import type { Metadata } from "next"
import VoiceQuoteWizard from "./VoiceQuoteWizard"

export const metadata: Metadata = {
  title: "Voice Quote — SendQuote",
  description: "Create quotes using voice commands. Speak and let SendQuote build your quote.",
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function VoiceQuotePage() {
  return <VoiceQuoteWizard />
}
