"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, X, Volume2, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: SpeechRecognitionResultList; resultIndex: number }) => void) | null;
  onerror: ((event: { error: string; message: string }) => void) | null;
  onend: (() => void) | null;
};

export function VoiceAssistant() {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi! I'm your SendQuote AI assistant. Ask me anything about creating quotes, closing deals, or using the platform." },
  ]);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  async function handleUserMessage(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setTranscript("");
    setProcessing(true);

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const reply = data.response || "I'm not sure how to respond to that.";

      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);

      if ("speechSynthesis" in window) {
        setSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = "en-IN";
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error("Voice assistant error:", e);
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I couldn't process that. Please try again." }]);
    }
    setProcessing(false);
  }
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition
        || (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition() as SpeechRecognitionInstance;
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-IN";

        recognitionRef.current.onresult = (event: { results: SpeechRecognitionResultList; resultIndex: number }) => {
          const current = event.results[event.results.length - 1];
          const text = current[0].transcript;
          setTranscript(text);

          if (current.isFinal) {
            handleUserMessage(text);
          }
        };

        recognitionRef.current.onerror = () => {
          setListening(false);
          setTranscript("");
        };

        recognitionRef.current.onend = () => {
          setListening(false);
        };
      }
    }
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);


  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      setTranscript("");
      try {
        recognitionRef.current?.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      setSpeaking(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
        aria-label="Open voice assistant"
      >
        <Volume2 className="h-6 w-6" />
      </button>
    );
  }

  const hasSpeechSupport = typeof window !== "undefined" && (!!(window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition || !!(window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between bg-primary/10 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            <Volume2 className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-card-foreground">AI Voice Assistant</span>
          {speaking && <span className="text-xs text-primary animate-pulse">Speaking...</span>}
        </div>
        <button onClick={() => { setOpen(false); stopSpeaking(); }} aria-label="Close voice assistant" className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="h-[320px] overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-primary/20 text-foreground"
                : "bg-muted text-muted-foreground"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {processing && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-border p-3 space-y-2">
        <form onSubmit={(e) => { e.preventDefault(); if (textInput.trim()) handleUserMessage(textInput); }} className="flex items-center gap-2">
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type a message..."
            aria-label="Type a message"
            className="flex-1 rounded-lg bg-muted border border-border px-3 py-2 text-sm text-card-foreground outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
            disabled={processing}
          />
          <button
            type="submit"
            disabled={!textInput.trim() || processing}
            aria-label="Send message"
            className="flex items-center justify-center rounded-lg bg-primary p-2 text-primary-foreground disabled:opacity-30 hover:bg-primary/90 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
        <div className="flex items-center gap-2">
          {hasSpeechSupport ? (
            <button
              onClick={toggleListening}
              disabled={processing}
              className={`flex items-center justify-center rounded-full p-2 transition-all ${
                listening
                  ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } disabled:opacity-50`}
              aria-label={listening ? "Stop listening" : "Start listening"}
            >
              {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-xs text-muted-foreground">
              <MicOff className="h-3 w-3" /> Voice not supported
            </div>
          )}
          {listening && (
            <div className="flex-1 text-xs text-primary animate-pulse truncate">
              {transcript || "Listening..."}
            </div>
          )}
          {!listening && !transcript && (
            <div className="flex-1 text-xs text-muted-foreground">
              {hasSpeechSupport ? "Or tap the mic" : ""}
            </div>
          )}
          {transcript && !listening && (
            <div className="flex-1 text-xs text-muted-foreground truncate">{transcript}</div>
          )}
          {speaking && (
            <button onClick={stopSpeaking} className="text-xs text-muted-foreground hover:text-foreground underline">Stop</button>
          )}
        </div>
      </div>
    </div>
  );
}
