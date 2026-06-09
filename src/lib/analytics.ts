export async function trackEvent(event: string, properties?: Record<string, any>) {
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

export function trackClientEvent(event: string, properties?: Record<string, any>) {
  try {
    if (typeof window !== "undefined" && (window as any).posthog) {
      (window as any).posthog.capture(event, properties);
    }
  } catch {
    // Non-critical
  }
}
