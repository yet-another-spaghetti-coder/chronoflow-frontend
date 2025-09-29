import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useEventStore } from "@/stores/eventStore";

export default function SpecificEventGroupPage() {
  const { id } = useParams<{ id: string }>();
  const setSelectedEventId = useEventStore((s) => s.setSelectedEventId);

  useEffect(() => {
    setSelectedEventId(id ?? null);
    return () => setSelectedEventId(null);
  }, [id, setSelectedEventId]);

  return <p>Specific event{id ? `: ${id}` : ""} 's group page</p>;
}
