"use client";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <OnboardingWizard />
    </div>
  );
}
