"use client";

import { useEffect, useRef } from "react";

interface TurnstileWidget {
  render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; theme: string }) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileWidget;
  }
}

interface TurnstileProps {
  onVerify: (token: string) => void;
}

export function Turnstile({ onVerify }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.turnstile && containerRef.current) {
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
          callback: onVerify,
          theme: "dark",
        });
      }
    };

    return () => {
      if (window.turnstile && widgetId.current) {
        window.turnstile.remove(widgetId.current);
      }
    };
  }, [onVerify]);

  return <div ref={containerRef} className="flex justify-center" />;
}
