"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center px-4 bg-background">
        <Card className="w-full max-w-sm bg-card border-border text-foreground">
          <CardHeader className="text-center">
          <CardTitle className="text-2xl text-foreground">Check your email</CardTitle>
          <CardDescription className="text-muted-foreground">We&apos;ve sent a password reset link to {email}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login" className={buttonVariants({ variant: "outline", className: "border-border text-foreground/70 hover:bg-muted/50" })}>Back to Sign In</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-sm bg-card border-border text-foreground">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto flex items-center justify-center gap-2 mb-4">
            <Image src="/logo.webp" alt="SendQuote" width={512} height={512} className="mx-auto h-12 w-12" />
            <span className="text-xl font-bold text-foreground">SendQuote</span>
          </Link>
          <CardTitle className="text-2xl text-foreground">Reset password</CardTitle>
          <CardDescription className="text-muted-foreground">Enter your email and we&apos;ll send you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/70">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50" placeholder="you@example.com" />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
