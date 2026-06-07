"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { SignaturePad } from "./signature-pad";
import { Check, Loader2, CreditCard, Wallet } from "lucide-react";

interface SignQuoteFlowProps {
  publicToken: string;
  quoteNumber: string;
  total?: number;
  onSigned: () => void;
}

type Step = "details" | "sign" | "payment" | "done";

export function SignQuoteFlow({ publicToken, quoteNumber, total = 0, onSigned }: SignQuoteFlowProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "stripe" | null>(null);

  async function handleSign() {
    if (!signature) return;
    setLoading(true);

    const res = await fetch("/api/quotes/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_token: publicToken, signatory_name: name, signatory_email: email, signature_data: signature }),
    });

    if (res.ok) {
      if (total > 0) {
        setStep("payment");
      } else {
        setStep("done");
        onSigned();
        toast.success("Quote accepted successfully!");
      }
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to accept");
    }
    setLoading(false);
  }

  async function handleRazorpayPayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, currency: "INR" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "SendQuote",
        description: `Quote ${quoteNumber}`,
        prefill: { name, email },
        handler: () => {
          setStep("done");
          onSigned();
          toast.success("Payment successful! Quote accepted.");
        },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
      setLoading(false);
    }
  }

  function reset() { setStep("details"); setName(""); setEmail(""); setSignature(null); setPaymentMethod(null); setOpen(false); }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); else setOpen(true); }}>
      <DialogTrigger>
        <button className="inline-flex h-10 items-center justify-center rounded-xl bg-[#00D4AA] px-5 text-sm font-semibold text-black hover:bg-[#00D4AA]/90 transition-colors w-full sm:w-auto" type="button">
          <Check className="mr-2 h-4 w-4" />
          Accept Quote
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "details" && (
          <>
            <DialogHeader>
              <DialogTitle>Accept Quote {quoteNumber}</DialogTitle>
              <DialogDescription>Review and accept this quote. Your signature confirms agreement.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
              </div>
              <Button className="w-full" onClick={() => setStep("sign")}>Continue to Sign</Button>
            </div>
          </>
        )}
        {step === "sign" && (
          <>
            <DialogHeader>
              <DialogTitle>Sign to Accept</DialogTitle>
              <DialogDescription>Draw your signature below.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <SignaturePad onSave={(d) => setSignature(d)} />
            </div>
            <Button className="w-full" onClick={handleSign} disabled={!signature || loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Accept & Sign"}
            </Button>
          </>
        )}
        {step === "payment" && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
              <DialogDescription>Choose a payment method to pay ₹{total.toLocaleString("en-IN")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <button
                onClick={() => { setPaymentMethod("razorpay"); handleRazorpayPayment(); }}
                disabled={loading}
                className="w-full flex items-center gap-4 rounded-lg border border-white/10 bg-[#1a1a1a] p-4 hover:bg-[#222] transition-colors disabled:opacity-50 text-left"
              >
                <Wallet className="h-6 w-6 text-[#00D4AA]" />
                <div>
                  <p className="font-medium text-white">Pay with Razorpay</p>
                  <p className="text-sm text-white/40">UPI, Credit Card, Net Banking</p>
                </div>
              </button>
              <button
                onClick={() => { setPaymentMethod("stripe"); }}
                disabled={loading}
                className="w-full flex items-center gap-4 rounded-lg border border-white/10 bg-[#1a1a1a] p-4 hover:bg-[#222] transition-colors disabled:opacity-50 text-left"
              >
                <CreditCard className="h-6 w-6 text-[#00D4AA]" />
                <div>
                  <p className="font-medium text-white">Pay with Card (Stripe)</p>
                  <p className="text-sm text-white/40">International cards, Google Pay, Apple Pay</p>
                </div>
              </button>
              <p className="text-center text-xs text-white/30 mt-2">Powered by Razorpay & Stripe</p>
            </div>
          </>
        )}
        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center flex items-center justify-center gap-2">
                <Check className="h-5 w-5 text-green-500" /> Accepted!
              </DialogTitle>
              <DialogDescription className="text-center">
                Quote {quoteNumber} has been accepted. You&apos;ll receive the invoice via email.
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full" onClick={reset}>Close</Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
