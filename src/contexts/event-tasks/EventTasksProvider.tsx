import React, { useMemo } from "react";
import { useEventTasks } from "@/hooks/event-tasks/useEventTasks";
import { TasksContext, type TasksContextValue } from "./useEventTasksContext";
import { useAuthStore } from "@/stores/authStore";
import { filterMyTasks, filterMyAssignedTasks } from "@/services/eventTask";

type TasksProviderProps = {
  eventId: string | null;
  autoFetch?: boolean;
  children: React.ReactNode;
};

export function TasksProvider({
  eventId,
  autoFetch = false,
  children,
}: TasksProviderProps) {
  const { tasks, loading, error, onRefresh } = useEventTasks(
    eventId,
    autoFetch
  );
  const currentUserId = useAuthStore((s) => s.user?.id ?? "");

  const value: TasksContextValue = useMemo(() => {
    const myTasks = filterMyTasks(tasks, currentUserId);
    const myAssignedTasks = filterMyAssignedTasks(tasks, currentUserId);

    return {
      allTasks: tasks,
      myTasks,
      myAssignedTasks,
      loading,
      error,
      onRefresh,
      eventId,
    };
  }, [tasks, loading, error, onRefresh, eventId, currentUserId]);

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}
