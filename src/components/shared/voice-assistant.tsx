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
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition() as SpeechRecognitionInstance;
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-IN";

        recognitionRef.current.onresult = (event: any) => {
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
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I couldn't process that. Please try again." }]);
    }
    setProcessing(false);
  }

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
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#00D4AA] text-black shadow-lg hover:bg-[#00D4AA]/90 transition-all hover:scale-105 active:scale-95"
        aria-label="Open voice assistant"
      >
        <Volume2 className="h-6 w-6" />
      </button>
    );
  }

  const hasSpeechSupport = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-white/[0.08] bg-[#0e0e0e] shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between bg-[#00D4AA]/10 px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00D4AA] text-black text-xs font-bold">
            <Volume2 className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-white">AI Voice Assistant</span>
          {speaking && <span className="text-xs text-[#00D4AA] animate-pulse">Speaking...</span>}
        </div>
        <button onClick={() => { setOpen(false); stopSpeaking(); }} className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="h-[320px] overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-[#00D4AA]/20 text-white"
                : "bg-white/5 text-white/80"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {processing && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-white/5 px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-white/40" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2">
          {hasSpeechSupport ? (
            <button
              onClick={toggleListening}
              disabled={processing}
              className={`flex items-center justify-center rounded-full p-2.5 transition-all ${
                listening
                  ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
                  : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
              } disabled:opacity-50`}
              aria-label={listening ? "Stop listening" : "Start listening"}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs text-white/40">
              <MicOff className="h-3 w-3" /> Voice not supported
            </div>
          )}
          {listening && (
            <div className="flex-1 text-xs text-[#00D4AA] animate-pulse truncate">
              {transcript || "Listening..."}
            </div>
          )}
          {!listening && !transcript && (
            <div className="flex-1 text-xs text-white/30">
              {hasSpeechSupport ? "Tap the mic and ask anything" : "Type your question below"}
            </div>
          )}
          {transcript && !listening && (
            <div className="flex-1 text-xs text-white/50 truncate">{transcript}</div>
          )}
          {speaking && (
            <button
              onClick={stopSpeaking}
              className="text-xs text-white/40 hover:text-white underline"
            >
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
