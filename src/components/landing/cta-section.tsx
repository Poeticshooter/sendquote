import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="border-t px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground sm:px-16">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Close Deals Faster?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Join businesses using SendQuote to cut quote-to-close time by 75%.
              Start free — no credit card required.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className={buttonVariants({ size: "lg", variant: "secondary" })}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                  className: "border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10",
                })}
              >
                View Pricing
              </Link>
            </div>
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary to-primary/50" />
        </div>
      </div>
    </section>
  );
}
