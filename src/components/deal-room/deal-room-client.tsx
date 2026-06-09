"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
// Tabs import skipped - not used
import { MessageSquare, Send, ChevronDown } from "lucide-react";

interface DealRoomClientProps {
  quoteId: string;
  publicToken: string;
  quoteNumber: string;
  clientName: string;
}

interface Message {
  id: string;
  sender_type: "seller" | "buyer";
  sender_name: string;
  message: string;
  created_at: string;
}

export function DealRoomClient({ quoteId, publicToken, quoteNumber }: DealRoomClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    fetch(`/api/chat?quote_id=${quoteId}`)
      .then((r) => r.json())
      .then((data) => { setMessages(data || []); scrollToBottom(); })
      .catch((err) => console.error("Failed to load deal room messages:", err))
      .finally(() => setLoadingMessages(false));

    const channel = supabase
      .channel(`deal_room_${quoteId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deal_room_messages", filter: `quote_id=eq.${quoteId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [quoteId, supabase, scrollToBottom]);

  useEffect(() => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_id: quoteId, event_type: "viewed", metadata: { page: "deal_room" } }),
    }).catch(() => {});
  }, [quoteId]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const res = await fetch("/api/chat/buyer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_token: publicToken, message: newMessage, sender_name: buyerName || "You" }),
    });

    if (res.ok) setNewMessage("");
  }

  if (!chatOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={() => setChatOpen(true)} className="rounded-full shadow-lg gap-2">
          <MessageSquare className="h-5 w-5" />
          Ask a Question
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full max-w-sm border-l border-t bg-card shadow-xl rounded-t-xl sm:right-4 sm:bottom-4 sm:border sm:rounded-xl overflow-hidden" style={{ height: "60vh", maxHeight: "500px" }}>
      <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
        <span className="font-medium text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Chat about {quoteNumber}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)} className="text-primary-foreground hover:bg-primary/80 rounded-full h-7 w-7" aria-label="Minimize chat">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col" style={{ height: "calc(100% - 44px)" }}>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {loadingMessages ? (
            <div className="space-y-3 p-2">
              <Skeleton className="h-12 w-3/4 rounded-lg" />
              <Skeleton className="h-12 w-1/2 rounded-lg ml-auto" />
              <Skeleton className="h-12 w-2/3 rounded-lg" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground mt-8">No messages yet. Start the conversation!</p>
          ) : null}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_type === "buyer" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                msg.sender_type === "buyer" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {msg.sender_type === "buyer" && <p className="text-xs opacity-70 mb-1">{msg.sender_name}</p>}
                <p>{msg.message}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t p-3 flex gap-2">
          <Input
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder="Your name"
            className="w-24 text-xs"
          />
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || loadingMessages}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
