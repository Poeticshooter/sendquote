type AnalyticsEvent = "page_view" | "signup" | "login" | "quote_created" | "quote_sent" | "quote_accepted" | "payment_completed" | "subscription_started" | "subscription_cancelled";

type AnalyticsProperties = Record<string, string | number | boolean | null>;

interface PostHog {
  capture: (event: string, properties?: AnalyticsProperties) => void;
}

declare global {
  interface Window {
    posthog?: PostHog;
  }
}

export async function trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties) {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        properties: { ...properties, userId: user.id },
      }),
    });
  } catch {
    // Analytics failures are non-critical
  }
}

export function trackClientEvent(event: string, properties?: AnalyticsProperties) {
  try {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture(event, properties);
    }
  } catch {
    // Non-critical
  }
}
