"use client";

import { m } from "@/components/shared/motion-client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Sparkles, ArrowRight, TrendingUp, Clock, Zap } from "lucide-react";

const stats = [
  { icon: Clock, label: "Avg. time to first quote", value: "< 60s" },
  { icon: TrendingUp, label: "Quote-to-close reduction", value: "75%" },
  { icon: Zap, label: "Win rate improvement", value: "+35%" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3, duration: 0.8 } },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8">
      <m.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl"
      >
        <m.div variants={itemVariants} className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-primary/5 border-primary/20 px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Deal Closing Platform
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            The Fastest Path From{" "}
            <span className="text-primary">Conversation</span>
            <br />
            to{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Contract
            </span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
            SendQuote transforms quotations into intelligent deal rooms. Generate
            AI-powered quotes in 60 seconds, track buyer intent in real time —
            and close deals, all in one platform.
          </p>

          <m.div
            variants={itemVariants}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/signup"
              className={buttonVariants({ size: "lg", className: "group relative overflow-hidden" })}
            >
              <span className="relative z-10 flex items-center">
                Start Closing Deals Faster
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              href="/pricing"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              See Pricing
            </Link>
          </m.div>
        </m.div>

        <m.div
          variants={itemVariants}
          className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {stats.map((stat) => (
            <m.div
              key={stat.label}
              className="group rounded-xl border bg-card/50 backdrop-blur-sm p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all duration-300"
              whileHover={{ y: -4 }}
            >
              <stat.icon className="mx-auto h-6 w-6 text-primary mb-2" />
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </m.div>
          ))}
        </m.div>
      </m.div>

      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-secondary opacity-15 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>
    </section>
  );
}
