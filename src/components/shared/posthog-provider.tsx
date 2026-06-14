"use client";

import { useEffect, useCallback, Suspense } from "react";
import posthog from "posthog-js";
import { PostHogPageView } from "./posthog-pageview";

function isAnalyticsAllowed(): boolean {
  if (typeof window === "undefined") return false;
  const consent = localStorage.getItem("sendquote_cookies_accepted");
  return consent === "true";
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initPosthog = useCallback(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY && !posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        capture_pageview: false,
        loaded: (ph) => {
          if (process.env.NODE_ENV !== "production") ph.opt_out_capturing();
        },
      });
    }
  }, []);

  useEffect(() => {
    if (isAnalyticsAllowed()) {
      initPosthog();
    }

    const handleConsent = () => {
      if (isAnalyticsAllowed()) initPosthog();
    };
    window.addEventListener("sendquote:consent", handleConsent);
    return () => window.removeEventListener("sendquote:consent", handleConsent);
  }, [initPosthog]);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
