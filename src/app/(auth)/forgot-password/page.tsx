"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/update-password` });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setSent(true);
    toast.success("Check your email for the reset link");
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-[#0A0A0A]">
        <Card className="w-full max-w-sm bg-[#141414] border-white/[0.06] text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Check your email</CardTitle>
            <CardDescription className="text-white/40">We&apos;ve sent a password reset link to {email}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login" className={buttonVariants({ variant: "outline", className: "border-white/10 text-white/70 hover:bg-white/5" })}>Back to Sign In</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-[#0A0A0A]">
      <Card className="w-full max-w-sm bg-[#141414] border-white/[0.06] text-white">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto flex items-center justify-center gap-2 mb-4">
            <Image src="/logo-icon-v2.svg" alt="" width={44} height={44} className="h-11 w-11" />
            <span className="text-xl font-bold text-white">SendQuote</span>
          </Link>
          <CardTitle className="text-2xl text-white">Reset password</CardTitle>
          <CardDescription className="text-white/40">Enter your email and we&apos;ll send you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/30" placeholder="you@example.com" />
            </div>
            <Button type="submit" className="w-full bg-[#00D4AA] text-black hover:bg-[#00D4AA]/90 font-semibold" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-white/40">
            Remember your password? <Link href="/login" className="text-[#00D4AA] hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
