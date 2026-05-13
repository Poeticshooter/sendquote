import type { Metadata } from "next"
import PublicQuoteClient from "./PublicQuoteClient"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
}

export default function PublicQuotePage() {
  return <PublicQuoteClient />
}
