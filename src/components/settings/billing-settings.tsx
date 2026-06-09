"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import type { RazorpaySuccessResponse } from "@/lib/types/razorpay";
import type { PlanType, Profile } from "@/types";

const plans = [
  {
    id: "starter", name: "Starter", price: "Free", limit: "50 quotes/month",
    features: ["50 quotes/month", "Basic templates", "E-signature", "Buyer tracking", "PDF export"],
    popular: false,
  },
  {
    id: "growth", name: "Growth", price: "₹6,499", limit: "Unlimited quotes",
    features: ["Unlimited quotes", "AI quote generation", "CRM sync", "Approval workflows", "Smart follow-ups", "In-quote chat", "Priority support"],
    popular: true,
  },
  {
    id: "pro", name: "Pro", price: "₹16,499", limit: "Unlimited quotes",
    features: ["Everything in Growth", "Deal Room with portal", "Win/loss analytics", "Contract automation", "Custom branding", "API access", "Multi-team governance", "Dedicated support"],
    popular: false,
  },
];

export function BillingSettings() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
    });
  }, [supabase]);

  async function handleUpgrade(planId: PlanType) {
    if (!profile) return;
    if (planId === "starter") {
      setProcessing(true);
      const { error } = await supabase.from("profiles").update({ plan: "starter", updated_at: new Date().toISOString() }).eq("id", profile.id);
      if (error) { toast.error("Failed to downgrade"); setProcessing(false); return; }
      setProfile({ ...profile, plan: "starter" });
      toast.success("Downgraded to Starter plan");
      setProcessing(false);
      return;
    }

    setProcessing(true);
    const amount = planId === "growth" ? 6499 : 16499;

    const res = await fetch("/api/payments/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency: "INR" }),
    });

    const data = await res.json();

    if (typeof window.Razorpay !== "undefined") {
      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.id,
        handler: async function (this: void, response: RazorpaySuccessResponse) {
          if (!profile) return;
          await supabase.from("subscriptions").insert({
            user_id: profile.user_id,
            razorpay_subscription_id: response.razorpay_payment_id,
            razorpay_order_id: data.id,
            razorpay_payment_id: response.razorpay_payment_id,
            plan_type: planId,
            status: "active",
            amount,
          });
          await supabase.from("profiles").update({
            plan: planId,
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          }).eq("id", profile.id);
          setProfile({ ...profile, plan: planId, subscription_status: "active" });
          toast.success(`Upgraded to ${planId} plan!`);
          setProcessing(false);
        },
        modal: { ondismiss: () => setProcessing(false) },
      });
      rzp.open();
    } else {
      toast.error("Razorpay SDK not loaded");
      setProcessing(false);
    }
  }

  if (loading) return <div className="h-32 animate-pulse rounded-xl bg-white/5" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You&apos;re on the <span className="font-medium text-white capitalize">{profile?.plan || "starter"}</span> plan
            <Badge variant="outline" className="ml-2">
              {profile?.subscription_status === "active" ? "Active" : profile?.plan === "starter" ? "Free" : "Inactive"}
            </Badge>
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = profile?.plan === plan.id;
          return (
            <Card key={plan.id} className={`relative ${plan.popular ? "border-[#00D4AA]/30" : ""} ${isCurrent ? "ring-1 ring-[#00D4AA]/50" : ""}`}>
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 rounded-full bg-gradient-to-r from-[#00D4AA] to-[#06D6A0] px-3 py-0.5 text-[10px] font-semibold text-black">
                  Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.limit}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold text-white">{plan.price}<span className="text-sm font-normal text-white/40">{plan.id !== "starter" ? "/mo" : ""}</span></p>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00D4AA]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                  onClick={() => handleUpgrade(plan.id as PlanType)}
                  disabled={isCurrent || processing}
                >
                  {isCurrent ? "Current Plan" : processing ? <Loader2 className="h-4 w-4 animate-spin" /> : plan.id === "starter" ? "Downgrade" : `Upgrade to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
