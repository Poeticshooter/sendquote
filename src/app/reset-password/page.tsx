import type { Metadata } from "next"
import ResetPasswordClient from "./ResetPasswordClient"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your SendQuote account.",
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
