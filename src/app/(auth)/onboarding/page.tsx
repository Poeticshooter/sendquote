import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <h1 className="sr-only">Onboarding</h1>
      <OnboardingWizard />
    </main>
  );
}
