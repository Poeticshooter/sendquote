"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, CheckCircle2, ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("");

  function handleComplete() {
    localStorage.setItem("sq_onboarding_done", "true");
    toast.success("You're all set! Create your first quote.");
    router.push("/quotes/new");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-[#0A0A0A]">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo-icon-v2.svg" alt="SendQuote" className="h-10 w-10" />
            <span className="text-xl font-bold text-white">SendQuote</span>
          </Link>
        </div>

        <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-8">
          {/* Steps indicator */}
          <div className="flex gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full ${step >= 0 ? "bg-[#00D4AA]" : "bg-white/10"}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-[#00D4AA]" : "bg-white/10"}`} />
          </div>

          {step === 0 && (
            <div>
              <div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-[#00D4AA]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to SendQuote!
              </h2>
              <p className="text-white/60 mb-8">
                Create professional quotes, share them with clients, and get paid faster —
                all in one place.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex gap-3 items-start">
                  <FileText className="w-5 h-5 text-[#00D4AA] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-white font-medium">AI-Powered Quotes</p>
                    <p className="text-sm text-white/40">Generate professional quotes in 60 seconds with AI</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-[#00D4AA] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-white font-medium">Client Portal</p>
                    <p className="text-sm text-white/40">Clients can view, sign, and pay online</p>
                  </div>
                </div>
              </div>

              <Button onClick={() => setStep(1)} className="w-full bg-[#00D4AA] text-black hover:bg-[#00D4AA]/90 font-semibold">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-[#00D4AA]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Create Your First Quote
              </h2>
              <p className="text-white/60 mb-8">
                Let's create a quote together. You'll see how fast and easy it is.
              </p>

              <div className="space-y-4 mb-8 bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                <p className="text-sm text-white/60">
                  You'll be guided through:
                </p>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex gap-2">1. Add client details</li>
                  <li className="flex gap-2">2. Describe what you're quoting</li>
                  <li className="flex gap-2">3. Let AI generate the full quote</li>
                  <li className="flex gap-2">4. Share with your client</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1 border-white/10 text-white/70">
                  Back
                </Button>
                <Button onClick={handleComplete} className="flex-1 bg-[#00D4AA] text-black hover:bg-[#00D4AA]/90 font-semibold">
                  Create Quote <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
