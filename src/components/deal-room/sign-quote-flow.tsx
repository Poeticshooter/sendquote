"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { SignaturePad } from "./signature-pad";
import { Check, Loader2 } from "lucide-react";

interface SignQuoteFlowProps {
  publicToken: string;
  quoteNumber: string;
  onSigned: () => void;
}

export function SignQuoteFlow({ publicToken, quoteNumber, onSigned }: SignQuoteFlowProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"details" | "sign" | "done">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSign() {
    if (!signature) return;
    setLoading(true);

    const res = await fetch("/api/quotes/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_token: publicToken, signatory_name: name, signatory_email: email, signature_data: signature }),
    });

    if (res.ok) {
      setStep("done");
      onSigned();
      toast.success("Quote accepted successfully!");
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to accept");
    }
    setLoading(false);
  }

  function reset() { setStep("details"); setName(""); setEmail(""); setSignature(null); setOpen(false); }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); else setOpen(true); }}>
      <DialogTrigger>
        <Button size="lg" className="w-full sm:w-auto">
          <Check className="mr-2 h-4 w-4" />
          Accept Quote
        </Button>
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
        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center flex items-center justify-center gap-2">
                <Check className="h-5 w-5 text-green-500" /> Accepted!
              </DialogTitle>
              <DialogDescription className="text-center">
                Quote {quoteNumber} has been accepted. You'll receive the invoice via email.
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full" onClick={reset}>Close</Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
