import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const stats = [
  { label: "Average time to first quote", value: "< 60s" },
  { label: "Quote-to-close reduction", value: "75%" },
  { label: "Win rate improvement", value: "+35%" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Powered Deal Closing Platform — Launching 2026
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            The Fastest Path From{" "}
            <span className="text-primary">Conversation</span> to{" "}
            <span className="text-primary">Contract</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
            SendQuote transforms quotations into intelligent deal rooms. Generate
            AI-powered quotes in 60 seconds, track buyer intent in real time, and
            close deals — all in one platform.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className={buttonVariants({ size: "lg" })}
            >
              Start Closing Deals Faster
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              See Pricing
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-card p-6 text-center"
            >
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-secondary opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>
    </section>
  );
}
