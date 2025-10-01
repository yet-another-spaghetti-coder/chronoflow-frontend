import React, { createContext, useContext, useMemo } from "react";
import type { EventTask } from "@/lib/validation/schema";
import { useEventTasks } from "@/hooks/event-tasks/useEventTasks";

type TasksContextValue = {
  tasks: EventTask[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  eventId: string | null;
};

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

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

  const value = useMemo<TasksContextValue>(
    () => ({ tasks, loading, error, onRefresh, eventId }),
    [tasks, loading, error, onRefresh, eventId]
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useEventTasksContext(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error("useTasksContext must be used within a TasksProvider");
  }
  return ctx;
}
