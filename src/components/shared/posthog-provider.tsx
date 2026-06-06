"use client";

import { useEffect, Suspense } from "react";
import posthog from "posthog-js";
import { PostHogPageView } from "./posthog-pageview";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        capture_pageview: false,
        loaded: (ph) => {
          if (process.env.NODE_ENV !== "production") ph.opt_out_capturing();
        },
      });
    }
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
