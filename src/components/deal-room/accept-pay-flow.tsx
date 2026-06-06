"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { SignaturePad } from "./signature-pad";
import { Check, CreditCard, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface AcceptPayFlowProps {
  publicToken: string;
  total: number;
  currency?: string;
  onAccepted: () => void;
}

export function AcceptPayFlow({ publicToken, total, currency = "INR", onAccepted }: AcceptPayFlowProps) {
  const [step, setStep] = useState<"choose" | "sign" | "pay" | "done">("choose");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleAccept() {
    if (!signature) return;
    setLoading(true);

    const res = await fetch("/api/quotes/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_token: publicToken, signatory_name: name, signatory_email: email, signature_data: signature }),
    });

    if (res.ok) {
      setStep("pay");
      setLoading(false);
      toast.success("Quote accepted! You can now complete payment.");
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to accept");
      setLoading(false);
    }
  }

  async function handlePay() {
    setLoading(true);

    const res = await fetch("/api/payments/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total, currency }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.mock) {
      await fetch("/api/quotes/accept-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token: publicToken, payment_id: "mock_payment", amount: total }),
      });
      setStep("done");
      onAccepted();
      toast.success("Payment received (mock mode)!");
      return;
    }

    if (typeof window.Razorpay !== "undefined") {
      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.id,
        handler: async function (response: any) {
          await fetch("/api/quotes/accept-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_token: publicToken, payment_id: response.razorpay_payment_id, amount: total }),
          });
          setStep("done");
          onAccepted();
          toast.success("Payment successful!");
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } else {
      toast.error("Razorpay SDK not loaded. Try again or contact support.");
    }
  }

  function reset() {
    setStep("choose");
    setName("");
    setEmail("");
    setSignature(null);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); else setOpen(true); }}>
      <DialogTrigger>
        <Button size="lg" className="w-full sm:w-auto">
          <Check className="mr-2 h-4 w-4" />
          Accept &amp; Pay ${total}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle>Accept Quote</DialogTitle>
              <DialogDescription>Review and accept this quote. You can also choose to pay now.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="accept_name">Your Name</Label>
                <Input id="accept_name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accept_email">Email (optional)</Label>
                <Input id="accept_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
              </div>
              <p className="text-lg font-semibold text-center">Total: ${total}</p>
              <Button className="w-full" onClick={() => setStep("sign")}>
                Continue to Sign
              </Button>
            </div>
          </>
        )}

        {step === "sign" && (
          <>
            <DialogHeader>
              <DialogTitle>Sign to Accept</DialogTitle>
              <DialogDescription>Draw your signature below to accept this quote.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <SignaturePad onSave={(dataUrl) => setSignature(dataUrl)} />
            </div>
            <Button className="w-full" onClick={handleAccept} disabled={!signature || loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Accept Quote"}
            </Button>
          </>
        )}

        {step === "pay" && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
              <DialogDescription>Pay ${total} to finalize this agreement.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="rounded-lg border p-4 text-center">
                <CreditCard className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-semibold">${total}</p>
                <p className="text-sm text-muted-foreground">Pay via Razorpay</p>
              </div>
              <Button className="w-full" onClick={handlePay} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : `Pay $${total}`}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => { setStep("done"); onAccepted(); }}>
                Pay Later
              </Button>
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center flex items-center justify-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Done!
              </DialogTitle>
              <DialogDescription className="text-center">
                Quote accepted successfully. You'll receive the invoice via email.
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full" onClick={() => { reset(); }}>Close</Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
