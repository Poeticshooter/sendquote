"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Copy, Send, FileDown, MessageSquare, Eye, Smartphone, Monitor, Tablet, Bot, Sparkles } from "lucide-react";
import { FollowUpPanel } from "@/components/quotes/follow-up-panel";
import { DealCopilot } from "@/components/quotes/deal-copilot";
import Link from "next/link";
import type { Quote, QuoteItem } from "@/types";

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary", sent: "outline", opened: "default", accepted: "default",
  changes_requested: "outline", expired: "destructive", archived: "outline",
};

interface ChatMessage {
  id: string;
  sender_type: "seller" | "buyer";
  sender_name: string;
  message: string;
  created_at: string;
}

interface ActivityEvent {
  id: string;
  event_type: string;
  device_type: string | null;
  created_at: string;
}

function EventIcon({ type }: { type: string }) {
  if (type === "mobile") return <Smartphone className="h-3 w-3" />;
  if (type === "tablet") return <Tablet className="h-3 w-3" />;
  return <Monitor className="h-3 w-3" />;
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<(Quote & { quote_items?: QuoteItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const scrollChat = useCallback(() => chatEndRef.current?.scrollIntoView(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("quotes").select("*, quote_items(*)").eq("id", params.id).single()
        .then(({ data, error }) => {
          if (error) { router.push("/quotes"); return; }
          setQuote(data);
          setLoading(false);
        });
    });
  }, [params.id, router, supabase]);

  useEffect(() => {
    if (!quote?.id) return;
    supabase.from("quote_events").select("*").eq("quote_id", quote.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setEvents(data || []));
    supabase.from("deal_room_messages").select("*").eq("quote_id", quote.id).order("created_at", { ascending: true })
      .then(({ data }) => { setMessages(data || []); setTimeout(scrollChat, 100); });

    const channel = supabase.channel(`dr_${quote.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "deal_room_messages", filter: `quote_id=eq.${quote.id}` },
        (payload) => { setMessages((p) => [...p, payload.new as ChatMessage]); setTimeout(scrollChat, 100); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [quote?.id, supabase, scrollChat]);

  async function handleSend() {
    const res = await fetch("/api/quotes/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_id: quote?.id }),
    });
    if (res.ok) { toast.success("Quote sent!"); setQuote((p) => p ? { ...p, status: "sent" } : null); }
    else toast.error("Failed to send quote");
  }

  async function copyLink() {
    if (!quote?.public_token) return;
    await navigator.clipboard.writeText(`${window.location.origin}/q/${quote.public_token}`);
    toast.success("Link copied!");
  }

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatMsg.trim() || !quote) return;
    const res = await fetch("/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_id: quote.id, message: chatMsg }),
    });
    if (res.ok) setChatMsg("");
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 rounded-xl" /></div>;
  if (!quote) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/quotes" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{quote.quote_number}</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">{quote.client_name}</p>
              <Badge variant={statusColors[quote.status]}>{quote.status}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}><Copy className="mr-1 h-4 w-4" /> Copy Link</Button>
          <Button variant="outline" size="sm"><FileDown className="mr-1 h-4 w-4" /> PDF</Button>
          <Button size="sm" onClick={handleSend} disabled={quote.status === "accepted"}><Send className="mr-1 h-4 w-4" /> Send</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Quote Details</TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Activity
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Chat {messages.length > 0 && `(${messages.length})`}
          </TabsTrigger>
          <TabsTrigger value="copilot" className="flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5" /> Copilot
          </TabsTrigger>
          <TabsTrigger value="followup" className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Follow-Up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Quote Details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 mb-6">
                <p><span className="text-muted-foreground">Client:</span> {quote.client_name}</p>
                {quote.client_email && <p><span className="text-muted-foreground">Email:</span> {quote.client_email}</p>}
                {quote.client_phone && <p><span className="text-muted-foreground">Phone:</span> {quote.client_phone}</p>}
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium text-right">Qty</th>
                    <th className="pb-2 font-medium text-right">Rate</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.quote_items?.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">₹{Number(item.rate).toLocaleString("en-IN")}</td>
                      <td className="py-2 text-right">₹{Number(item.amount).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="border-t pt-2 space-y-1">
                <p>Subtotal: <span className="font-medium">₹{Number(quote.subtotal).toLocaleString("en-IN")}</span></p>
                {quote.gst_rate > 0 && <p>GST ({quote.gst_rate}%): <span className="font-medium">₹{Number(quote.gst_amount).toLocaleString("en-IN")}</span></p>}
                <p className="text-lg font-bold">Total: ₹{Number(quote.total).toLocaleString("en-IN")}</p>
              </div>
              {quote.notes && <div className="mt-6 border-t pt-4"><p className="text-sm font-medium">Notes</p><p className="text-sm text-muted-foreground mt-1">{quote.notes}</p></div>}
            </CardContent>
          </Card>

          {quote.public_token && (
            <Card>
              <CardHeader><CardTitle>Share Quote</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Share this link with your client:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded border bg-muted px-3 py-2 text-sm">
                    {typeof window !== "undefined" ? `${window.location.origin}/q/${quote.public_token}` : `https://sendquote.in/q/${quote.public_token}`}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Buyer Activity</CardTitle></CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No activity yet. Share the quote link to start tracking.</p>
              ) : (
                <div className="space-y-3">
                  {events.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Eye className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{ev.event_type.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          {new Date(ev.created_at).toLocaleString()}
                          {ev.device_type && (
                            <span className="flex items-center gap-1">
                              <EventIcon type={ev.device_type} /> {ev.device_type}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Deal Room Chat</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No messages yet. Chat with your client here.</p>}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === "seller" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      msg.sender_type === "seller" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <p className="text-xs opacity-70 mb-0.5">{msg.sender_name}</p>
                      <p>{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={sendChat} className="flex gap-2">
                <Input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} placeholder="Type a message..." className="flex-1" />
                <Button type="submit" size="sm" disabled={!chatMsg.trim()} aria-label="Send message"><Send className="h-4 w-4" /></Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="copilot" className="mt-4">
          <DealCopilot quoteId={quote.id} />
        </TabsContent>
        <TabsContent value="followup" className="mt-4">
          <FollowUpPanel quoteId={quote.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
