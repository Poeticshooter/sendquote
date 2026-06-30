"use client";

import { useEffect, useCallback, Suspense } from "react";
import posthog from "posthog-js";
import { PostHogPageView } from "./posthog-pageview";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initPosthog = useCallback(() => {
    try {
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
      if (key && !posthog.__loaded) {
        posthog.init(key, {
          api_host: host,
          capture_pageview: false,
          loaded: (ph) => {
            if (process.env.NODE_ENV !== "production") ph.opt_out_capturing();
          },
        });
      }
    } catch { /* posthog init failed silently */ }
  }, []);

  useEffect(() => {
    try { initPosthog(); } catch { /* */ }
    const handleConsent = () => { try { initPosthog(); } catch { /* */ } };
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
