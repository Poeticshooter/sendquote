import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Starter",
    price: "19",
    description: "For freelancers and solopreneurs getting started with professional quoting.",
    features: [
      "50 quotes per month",
      "Basic templates",
      "Native e-signature",
      "Buyer tracking",
      "PDF export",
      "Email support",
    ],
    cta: "Start Free Trial",
    href: "/signup",
    featured: false,
  },
  {
    name: "Growth",
    price: "79",
    description: "For small sales teams ready to accelerate their deal velocity.",
    features: [
      "Unlimited quotes",
      "AI quote generation",
      "CRM sync (HubSpot, Pipedrive)",
      "Approval workflows",
      "Smart follow-ups",
      "In-quote chat & negotiation",
      "Payment collection",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/signup",
    featured: true,
  },
  {
    name: "Pro",
    price: "199",
    description: "For scaling teams that need advanced analytics and deal intelligence.",
    features: [
      "Everything in Growth",
      "Deal Room with client portal",
      "Win/loss analytics",
      "AI pricing optimizer",
      "Contract automation",
      "Custom branding",
      "API access",
      "Multi-team governance",
      "Dedicated support",
    ],
    cta: "Start Free Trial",
    href: "/signup",
    featured: false,
  },
];

export function PricingTable() {
  return (
    <section className="border-t px-4 py-20 sm:px-6 lg:px-8" id="pricing">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade as you grow. No hidden fees.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative rounded-xl border bg-card p-8",
                tier.featured && "border-primary shadow-lg ring-1 ring-primary"
              )}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tier.description}
                </p>
                <div className="mt-6">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="ml-1 text-sm text-muted-foreground">
                    /user/month
                  </span>
                </div>
              </div>

              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={buttonVariants({
                  className: "mt-8 w-full",
                  variant: tier.featured ? "default" : "outline",
                })}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Need more?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact us
            </Link>{" "}
            for enterprise pricing with SSO, custom AI training, and dedicated SLAs.
          </p>
        </div>
      </div>
    </section>
  );
}
