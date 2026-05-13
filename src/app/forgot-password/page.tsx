import type { Metadata } from "next"
import ForgotPasswordClient from "./ForgotPasswordClient"

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your SendQuote password and regain access to your account.",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
