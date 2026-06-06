"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.capture("$pageview", {
        $current_url: `${pathname}${searchParams ? `?${searchParams}` : ""}`,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
