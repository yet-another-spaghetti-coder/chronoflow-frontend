import { create } from "zustand";
import { persist } from "zustand/middleware";

type EventStore = {
  selected_event_id: string | null;
  setSelectedEventId: (id: string | null) => void;
};

export const useEventStore = create<EventStore>()(
  persist(
    (set) => ({
      selected_event_id: null,
      setSelectedEventId: (id) => set({ selected_event_id: id }),
    }),
    { name: "selected-event" }
  )
);
