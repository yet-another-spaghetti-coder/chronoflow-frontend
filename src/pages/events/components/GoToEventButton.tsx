import { useNavigate } from "react-router-dom";
import { useEventStore } from "@/stores/eventStore";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function GoToEventButton({ id }: { id: string }) {
  const navigate = useNavigate();
  const setSelectedEventId = useEventStore((s) => s.setSelectedEventId);

  const onOpen = () => {
    setSelectedEventId(id);
    navigate(`/event/${id}/dashboard`);
  };

  return (
    <Button size="sm" variant="secondary" onClick={onOpen}>
      Go to event
      <ArrowRight className="ml-1 h-4 w-4" />
    </Button>
  );
}
