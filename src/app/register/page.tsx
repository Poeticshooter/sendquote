import type { Metadata } from "next"
import RegisterClient from "./RegisterClient"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your free SendQuote account. Create professional quotes in minutes, share via WhatsApp, and get notified when clients open them. Built for Indian businesses.",
}

export default function RegisterPage() {
  return <RegisterClient />
}
