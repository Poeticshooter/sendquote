"use client";

import { m } from "@/components/shared/motion-client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Sparkles, ArrowRight, TrendingUp, Clock, Zap } from "lucide-react";
import { DeviceMockup } from "./device-mockup";

const stats = [
  { icon: Clock, label: "Avg. time to first quote", value: "< 60s" },
  { icon: TrendingUp, label: "Quote-to-close reduction", value: "75%" },
  { icon: Zap, label: "Win rate improvement", value: "+35%" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-foreground/[0.02] blur-[120px]" />
        <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-foreground/[0.015] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <m.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" as const, bounce: 0.15 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-secondary/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Deal Closing Platform
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
            Close Deals{" "}
            <span className="text-foreground">Instantly</span>
            <br />
            <span className="text-muted-foreground">Not in Weeks</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto leading-relaxed">
            SendQuote transforms quotations into intelligent deal rooms.
            AI generates quotes in 60 seconds. Buyers sign & pay in one click.
            <span className="block mt-2 font-medium text-foreground/80">From conversation to contract — in hours, not days.</span>
          </p>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/signup"
              className={buttonVariants({
                size: "lg",
                className: "group"
              })}
            >
              Start Closing Deals Faster
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/pricing"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              See Pricing
            </Link>
          </m.div>
        </m.div>

        <DeviceMockup />

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl mx-auto"
        >
          {stats.map((stat, i) => (
            <m.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 + i * 0.15, type: "spring" as const, bounce: 0.2 }}
              className="group rounded-xl border bg-card/50 backdrop-blur-sm p-5 text-center hover:shadow-lg hover:border-foreground/20 transition-all duration-300"
              whileHover={{ y: -4 }}
            >
              <stat.icon className="mx-auto h-5 w-5 text-foreground mb-2" />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{stat.label}</div>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
