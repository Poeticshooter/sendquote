"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { m } from "./motion-client";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("sendquote_cookies_accepted");
    if (!accepted) {
      const timer = setTimeout(() => setShow(true), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem("sendquote_cookies_accepted", "true");
    setShow(false);
    window.dispatchEvent(new CustomEvent("sendquote:consent"));
  }

  function reject() {
    localStorage.setItem("sendquote_cookies_accepted", "rejected");
    setShow(false);
  }

  if (!show) return null;

  return (
    <m.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          We use cookies to improve your experience. By continuing, you agree to our{" "}
          <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
        </p>
        <div className="flex gap-3 shrink-0">
          <Button size="sm" variant="outline" onClick={reject}>Reject All</Button>
          <Button size="sm" onClick={accept}>Accept All</Button>
        </div>
      </div>
    </m.div>
  );
}
