"use client";

import { m } from "@/components/shared/motion-client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { DeviceMockup } from "./device-mockup";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-16 sm:pt-20 sm:pb-20 lg:pt-24 lg:pb-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-foreground/[0.015] blur-[150px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-foreground/[0.01] blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl mx-auto text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring" as const, bounce: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border bg-secondary/50 px-3.5 py-1 text-xs font-medium text-muted-foreground mb-6">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              AI-Powered Deal Closing Platform
            </div>
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
          >
            Close Deals{" "}
            <span className="text-muted-foreground">Instantly.</span>
            <br />
            <span className="text-foreground">Not in Weeks.</span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
          >
            AI generates quotes in 60 seconds. Buyers sign and pay in one click.
            <br />
            <span className="text-foreground/70 font-medium">From conversation to contract — in hours, not days.</span>
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/signup" className={buttonVariants({ size: "lg", className: "group w-full sm:w-auto" })}>
              Start Closing Deals Faster
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/pricing" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}>
              See Pricing
            </Link>
          </m.div>
        </div>

        <DeviceMockup />
      </div>
    </section>
  );
}
