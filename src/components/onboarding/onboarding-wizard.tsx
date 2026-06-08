"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  Building2,
  FileText,
  Share2,
  Check,
  Loader2,
} from "lucide-react";

const STEPS = [
  {
    id: "profile",
    title: "Your Business Profile",
    description: "Tell us about your business",
    icon: Building2,
  },
  {
    id: "sample",
    title: "Your First Quote",
    description: "We'll help you create one",
    icon: FileText,
  },
  {
    id: "share",
    title: "Share & Close",
    description: "Send your quote as a link",
    icon: Share2,
  },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");

  const handleProfileSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          phone: businessPhone,
          onboarding_completed: false,
        }),
      });
      if (res.ok) setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSample = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description:
            "Website design services - Homepage redesign with 5 pages, responsive layout, SEO optimization",
          client_name: "Sample Client",
          client_email: "client@example.com",
        }),
      });
      if (res.ok) setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/signup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_completed: true }),
      });
      localStorage.setItem("sq_onboarding_done", "true");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      {/* Steps indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                i <= step
                  ? "bg-[#00D4AA] text-black"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 transition-colors ${
                  i < step ? "bg-[#00D4AA]" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-border bg-card p-6">
        {step === 0 && (
          <div className="space-y-4">
            <div className="mb-2 flex items-center gap-3">
              <Building2 className="h-6 w-6 text-[#00D4AA]" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {STEPS[0].title}
                </h2>
                <p className="text-sm text-gray-400">
                  {STEPS[0].description}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Acme Corp"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="businessPhone">Phone Number</Label>
                <Input
                  id="businessPhone"
                  placeholder="+91 98765 43210"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleProfileSubmit}
              disabled={!businessName || loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Continue
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="mb-2 flex items-center gap-3">
              <FileText className="h-6 w-6 text-[#00D4AA]" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {STEPS[1].title}
                </h2>
                <p className="text-sm text-gray-400">
                  {STEPS[1].description}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              We'll create a sample quote using AI so you can see how it works.
              No credit card needed.
            </p>
            <Button
              onClick={handleCreateSample}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Create My First Quote with AI
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="mb-2 flex items-center gap-3">
              <Share2 className="h-6 w-6 text-[#00D4AA]" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {STEPS[2].title}
                </h2>
                <p className="text-sm text-gray-400">
                  {STEPS[2].description}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Your quote is ready! You can now share it as a link, track when
              clients view it, and get paid faster with Razorpay.
            </p>
            <Button
              onClick={handleFinish}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
