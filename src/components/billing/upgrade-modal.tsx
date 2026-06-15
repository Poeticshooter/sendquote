"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: "quote_limit" | "invoice_limit" | "feature_gate";
  featureName?: string;
}

const TRIGGER_COPY = {
  quote_limit: {
    title: "You've hit your monthly quote limit",
    subtitle: "You&apos;re using SendQuote more than most new users.",
    highlight: "Upgrade to send unlimited quotes and see when clients open them.",
  },
  invoice_limit: {
    title: "Invoice limit reached",
    subtitle: "Your business is growing — your plan should too.",
    highlight: "Upgrade for unlimited invoices, auto payment reminders, and GST reports.",
  },
  feature_gate: {
    title: "This feature requires an upgrade",
    subtitle: "",
    highlight: "",
  },
};

export function UpgradeModal({ isOpen, onClose, trigger, featureName }: UpgradeModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible) return null;

  const copy = TRIGGER_COPY[trigger];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl 
          transition-all duration-200 ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="text-3xl mb-3">⬆️</div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{copy.title}</h2>
          {copy.subtitle && (
            <p className="text-zinc-500 text-sm mt-1">{copy.subtitle}</p>
          )}
          {featureName && (
            <p className="text-zinc-500 text-sm mt-1">{featureName} is available on paid plans.</p>
          )}
        </div>

        <div className="bg-teal-50 dark:bg-teal-950 rounded-xl p-4 mb-6">
          <p className="text-teal-800 dark:text-teal-200 text-sm font-medium">{copy.highlight}</p>
        </div>

        <div className="space-y-3 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          {[
            "Unlimited quotes & invoices",
            "See when clients open your quote",
            "WhatsApp sharing with pre-written messages",
            "Auto payment reminders",
            "Client approval portal",
            "Remove SendQuote watermark from PDFs",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <span className="text-teal-500">✅</span> {feature}
            </div>
          ))}
        </div>

        <Link
          href="/settings"
          className="block w-full text-center py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors"
          onClick={onClose}
        >
          Upgrade — ₹199/month
        </Link>

        <button
          onClick={onClose}
          className="block w-full text-center py-2 text-zinc-400 text-sm hover:text-zinc-600 mt-2"
        >
          Maybe later
        </button>

        <p className="text-center text-xs text-zinc-400 mt-3">
          No credit card required · Cancel anytime
        </p>
      </div>
    </div>
  );
}
