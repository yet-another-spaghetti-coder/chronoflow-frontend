import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useEventStore } from "@/stores/eventStore";

export function SidebarSelectionGuard() {
  const { pathname } = useLocation();
  const { selected_event_id, setSelectedEventId } = useEventStore();

  useEffect(() => {
    if (!pathname.startsWith("/event/") && selected_event_id) {
      setSelectedEventId(null);
    }
  }, [pathname, selected_event_id, setSelectedEventId]);

  return null;
}
