import type { Metadata } from "next"
import VoiceQuoteWizard from "./VoiceQuoteWizard"

export const dynamic = 'force-dynamic'

export default function VoiceQuotePage() {
  return <VoiceQuoteWizard />
}
