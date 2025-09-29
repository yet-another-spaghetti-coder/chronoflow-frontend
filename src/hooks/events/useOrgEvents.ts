import { useCallback, useEffect, useState } from "react";
import { getEvents } from "@/api/eventApi";
import type { OrgEvent } from "@/lib/validation/schema";

export type UseOrgEventsType = {
  events: OrgEvent[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
};

export function useOrgEvents(autoFetch: boolean = false): UseOrgEventsType {
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
      else setError("Failed to load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) void fetchEvents();
  }, [autoFetch, fetchEvents]);

  return { events: events, loading, error, onRefresh: fetchEvents };
}
