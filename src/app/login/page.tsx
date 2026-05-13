import type { Metadata } from "next"
import LoginClient from "./LoginClient"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your SendQuote account to create, manage and share professional quotes with your clients.",
}

export default function LoginPage() {
  return <LoginClient />
}
