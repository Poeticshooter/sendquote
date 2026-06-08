"use client";

import { useEffect, useRef } from "react";

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
      const win = window as any;
      if (win.turnstile && containerRef.current) {
        widgetId.current = win.turnstile.render(containerRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
          callback: onVerify,
          theme: "dark",
        });
      }
    };

    return () => {
      const win = window as any;
      if (win.turnstile && widgetId.current) {
        win.turnstile.remove(widgetId.current);
      }
    };
  }, [onVerify]);

  return <div ref={containerRef} className="flex justify-center" />;
}
