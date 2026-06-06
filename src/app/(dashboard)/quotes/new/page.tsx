"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, rate: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [gstRate, setGstRate] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [sending, setSending] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  async function generateWithAI() {
    if (!aiPrompt.trim()) { toast.error("Describe what you're quoting"); return; }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiPrompt }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      if (data.items?.length > 0) {
        setItems(data.items);
        setNotes(data.notes || "");
        setTerms(data.terms || "");
        toast.success("AI quote generated! Review and adjust as needed.");
      }
    } catch {
      toast.error("AI generation failed. Try again or build manually.");
    }
    setAiLoading(false);
  }

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    if (field === "quantity" || field === "rate") {
      newItems[index].quantity = Number(newItems[index].quantity) || 0;
      newItems[index].rate = Number(newItems[index].rate) || 0;
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const gstAmount = subtotal * (gstRate / 100);
  const total = subtotal + gstAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in"); setSending(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("quote_counter, organization_id")
      .eq("user_id", user.id)
      .single();

    const nextNum = (profile?.quote_counter || 0) + 1;
    const date = new Date();
    const quoteNumber = `QTE-${date.getFullYear()}-${String(nextNum).padStart(4, "0")}`;

    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({
        user_id: user.id,
        quote_number: quoteNumber,
        client_name: clientName,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        status: "draft",
        subtotal,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total,
        notes: notes || null,
        terms: terms || null,
        organization_id: profile?.organization_id || null,
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setSending(false);
      return;
    }

    for (const item of items) {
      await supabase.from("quote_items").insert({
        quote_id: quote.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.quantity * item.rate,
      });
    }

    await supabase
      .from("profiles")
      .update({ quote_counter: nextNum })
      .eq("user_id", user.id);

    toast.success("Quote created!");
    router.push(`/quotes/${quote.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/quotes" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Quote</h2>
          <p className="text-muted-foreground">Create a new quote for your client.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate with AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Describe what you&apos;re quoting and AI will generate line items, pricing, and terms.
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder='e.g. "Website redesign for a dental clinic with 5 pages and SEO"'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <Button type="button" onClick={generateWithAI} disabled={aiLoading} variant="secondary">
                {aiLoading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Generating...</> : "Generate"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@acme.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Phone</Label>
                <Input
                  id="clientPhone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+1 555-1234"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    required
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    min={1}
                    required
                  />
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => updateItem(index, "rate", e.target.value)}
                    min={0}
                    step="0.01"
                    required
                  />
                </div>
                <div className="w-24 pt-2 text-sm text-right text-muted-foreground">
                  ${(item.quantity * item.rate).toFixed(2)}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addItem} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span>Currency</span>
                <select
                  className="h-7 rounded border bg-background px-2 text-sm"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                  <option value="AED">د.إ AED</option>
                  <option value="SGD">S$ SGD</option>
                </select>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span>GST</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-20 h-7 text-sm"
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value) || 0)}
                    min={0}
                    max={100}
                  />
                  <span>%</span>
                  <span className="w-20 text-right">${gstAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes & Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for the client..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms, delivery timelines, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/quotes" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
          <Button type="submit" disabled={sending}>
            {sending ? "Creating..." : "Create Quote"}
          </Button>
        </div>
      </form>
    </div>
  );
}
