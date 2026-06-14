"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Smartphone, Monitor, Tablet, Clock } from "lucide-react";

interface Event {
  id: string;
  event_type: string;
  device_type: string | null;
  ip: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function EventIcon({ event_type }: { event_type: string }) {
  switch (event_type) {
    case "viewed": return <Eye className="h-4 w-4" />;
    case "pricing_viewed": return <Eye className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
}

function DeviceIcon({ device_type }: { device_type: string | null }) {
  switch (device_type) {
    case "mobile": return <Smartphone className="h-3 w-3" />;
    case "tablet": return <Tablet className="h-3 w-3" />;
    default: return <Monitor className="h-3 w-3" />;
  }
}

export function ActivityTimeline({ quoteId }: { quoteId: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("quote_events")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setEvents(data || []);
        setLoading(false);
      });
  }, [quoteId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4" />
          Buyer Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No activity recorded yet. Share the quote link to start tracking.
          </p>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 10).map((event) => (
              <div key={event.id} className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <EventIcon event_type={event.event_type} />
                </div>
                <div className="flex-1">
                  <p className="font-medium capitalize">{event.event_type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    {new Date(event.created_at).toLocaleString()}
                    {event.device_type && (
                      <span className="flex items-center gap-1">
                        <DeviceIcon device_type={event.device_type} />
                        {event.device_type}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
