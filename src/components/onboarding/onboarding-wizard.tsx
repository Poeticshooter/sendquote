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
  Zap,
  Eye,
  MessageCircle,
  IndianRupee,
  ChevronRight,
} from "lucide-react";

const STEPS = [
  {
    id: "profile",
    title: "Your Business Profile",
    description: "Tell us about your business",
    icon: Building2,
  },
  {
    id: "tour",
    title: "Quick Tour",
    description: "See what SendQuote can do",
    icon: Zap,
  },
  {
    id: "done",
    title: "You're All Set",
    description: "Start sending professional quotes",
    icon: Check,
  },
];

const TOUR_SLIDES = [
  {
    icon: FileText,
    title: "Create Quotes in 60 Seconds",
    description:
      "Describe your project and AI generates complete line items, pricing, and GST calculations instantly. No templates, no spreadsheets.",
    color: "from-teal-500 to-emerald-600",
  },
  {
    icon: Eye,
    title: "Know When Clients View Your Quote",
    description:
      "Get a notification the moment your client opens the quote. Follow up when interest is at its peak — not a day later.",
    color: "from-purple-500 to-indigo-600",
  },
  {
    icon: MessageCircle,
    title: "Share on WhatsApp — One Tap",
    description:
      "Indian businesses use WhatsApp, not email. Share quotes and invoices with pre-written messages. Your client approves from their phone.",
    color: "from-green-500 to-teal-600",
  },
  {
    icon: IndianRupee,
    title: "Get Paid Instantly with UPI QR",
    description:
      "Every invoice has a UPI QR code. Clients scan with GPay, PhonePe, or Paytm and pay in seconds. No bank transfer wait.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: Share2,
    title: "Client Portal — No Login Required",
    description:
      "Clients get a private link. They see the quote, approve or request changes, and pay — all without creating an account.",
    color: "from-amber-500 to-orange-600",
  },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [tourSlide, setTourSlide] = useState(0);
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
          businessName,
          businessPhone,
          onboardingStep: "profile",
        }),
      });
      if (res.ok) setStep(1);
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
        {/* STEP 0: Profile */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="mb-2 flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {STEPS[0].title}
                </h2>
                <p className="text-sm text-muted-foreground">
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
              Continue to Tour
            </Button>
          </div>
        )}

        {/* STEP 1: Interactive Tour */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Slide indicator dots */}
            <div className="flex justify-center gap-1.5">
              {TOUR_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTourSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === tourSlide
                      ? "w-6 bg-[#00D4AA]"
                      : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            {/* Slide content */}
            {(() => {
              const slide = TOUR_SLIDES[tourSlide];
              const Icon = slide.icon;
              return (
                <div className="flex flex-col items-center text-center space-y-4 py-4">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${slide.color} shadow-lg animate-bounce`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {slide.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                    {slide.description}
                  </p>
                </div>
              );
            })()}

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (tourSlide > 0) setTourSlide(tourSlide - 1);
                }}
                disabled={tourSlide === 0}
                className="flex-1"
              >
                Back
              </Button>
              {tourSlide < TOUR_SLIDES.length - 1 ? (
                <Button
                  onClick={() => setTourSlide(tourSlide + 1)}
                  className="flex-1"
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Finish Tour
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Done */}
        {step === 2 && (
          <div className="space-y-4 py-4 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00D4AA]/10">
                <Check className="h-8 w-8 text-[#00D4AA]" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              You're All Set, {businessName || "Friend"}!
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Here&apos;s your quick-start checklist:
            </p>
            <div className="space-y-2 text-left">
              {[
                "Create your first quote in under 2 minutes",
                "Share on WhatsApp — clients approve from their phone",
                "Get paid via UPI QR — no bank transfer delays",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-[#00D4AA] mt-0.5">•</span>
                  {item}
                </div>
              ))}
            </div>
            <Button
              onClick={handleFinish}
              disabled={loading}
              className="w-full mt-4"
              size="lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
