"use client";

import { m } from "@/components/shared/motion-client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="border-t px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-secondary/80 px-8 py-20 text-center text-primary-foreground sm:px-16"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Ready to Close Deals Faster?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Join thousands of businesses using SendQuote to cut quote-to-close time by 75%.
              Start free — no credit card required.
            </p>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            >
              <Link
                href="/signup"
                className={buttonVariants({
                  size: "lg",
                  variant: "secondary",
                  className: "group"
                })}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
            </m.div>
          </div>
        </m.div>
      </div>
    </section>
  );
}
