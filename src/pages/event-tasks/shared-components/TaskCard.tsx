import * as React from "react";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ArrowRight, ChevronUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import type { EventTask } from "@/lib/validation/schema";
import {
  getInitialName,
  getTaskStatusStyle,
  type TaskStatusCode,
  type TaskStatusEnumType,
  getStatusUX,
  getActionOptionsForStatus,
  TaskActionEnum,
  type AllowAction,
} from "@/services/eventTask";
import { useEventTasksContext } from "@/contexts/event-tasks/useEventTasksContext";
import { updateEventTask, deleteEventTask } from "@/api/eventTasksApi";
import { useAuthStore } from "@/stores/authStore";
import TaskConfigUpdateFormModal from "./TaskConfigForm";
import TaskReassignModal from "./TaskReassignForm";
import TaskLogModal from "./TaskLogPanel";

type TaskCardProps = { task: EventTask };

export function TaskCard({ task }: TaskCardProps) {
  console.log("Rendering TaskCard for task:", task);
  const { eventId, onRefresh, assignableMembers, loading } =
    useEventTasksContext();
  const currentUserId = useAuthStore((s) => s.user?.id ?? "");
  const isAssigner = task.assignerUser?.id === currentUserId;
  const isAssignee = task.assignedUser?.id === currentUserId;
  const isParticipant = isAssigner || isAssignee;

  const assigneeInitials = getInitialName(task.assignedUser?.name);
  const assignerInitials = getInitialName(task.assignerUser?.name);

  const dueText = React.useMemo(() => {
    if (!task.endTime) return "Not Scheduled";
    const d = new Date(task.endTime);
    if (Number.isNaN(d.getTime())) return "Not Scheduled";
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [task.endTime]);

  const isScheduled = React.useMemo(() => {
    if (!task.endTime) return false;
    const d = new Date(task.endTime);
    return !Number.isNaN(d.getTime());
  }, [task.endTime]);

  const [isOpen, setIsOpen] = React.useState(true);

  const statusStyle = React.useMemo(
    () => getTaskStatusStyle(task.status as TaskStatusCode),
    [task.status]
  );

  const statusText = React.useMemo(
    () => getStatusUX(task.status as TaskStatusEnumType, isAssigner) ?? "",
    [task.status, isAssigner]
  );

  const actions = React.useMemo(
    () =>
      getActionOptionsForStatus(task.status as TaskStatusEnumType, isAssigner),
    [task.status, isAssigner]
  );

  const canOpenUpdate = Boolean(eventId);

  const runInstantAction = async (type: AllowAction) => {
    if (!eventId) return;
    try {
      await updateEventTask(eventId, task.id, { type });
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Task updated successfully.",
      });
      onRefresh();
    } catch (err: unknown) {
      await Swal.fire({
        icon: "error",
        title: "Action failed",
        text:
          err instanceof Error
            ? err.message
            : "Operation failed. Please try again.",
      });
    }
  };

  const onDelete = async () => {
    if (!eventId) return;
    const res = await Swal.fire({
      icon: "warning",
      title: "Delete task?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!res.isConfirmed) return;

    try {
      await deleteEventTask(eventId, task.id);
      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Task deleted successfully.",
      });
      onRefresh();
    } catch (err: unknown) {
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text:
          err instanceof Error
            ? err.message
            : "Operation failed. Please try again.",
      });
    }
  };

  const assignerGroups = task.assignerUser?.groups ?? [];
  const assigneeGroups = task.assignedUser?.groups ?? [];

  return (
    <Collapsible asChild open={isOpen} onOpenChange={setIsOpen}>
      <Card className="w-full p-3">
        {/* Header (trigger) */}
        <CollapsibleTrigger
          className="flex w-full items-center justify-between text-left outline-none"
          aria-label={`Toggle details for task ${task.name}`}
        >
          <span className="font-medium truncate">{task.name}</span>
          {task.assignedUser && (
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="text-xs">
                {isOpen ? <ChevronUp /> : assigneeInitials}
              </AvatarFallback>
            </Avatar>
          )}
        </CollapsibleTrigger>

        {/* Expanded content */}
        <CollapsibleContent className="mt-2 space-y-6 text-sm">
          {/* Optional description */}
          {task.description && (
            <p className="text-muted-foreground">{task.description}</p>
          )}

          {/* Assigner → Assignee */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            {/* Assigner */}
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {assignerInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {task.assignerUser?.name ?? "Unassigned"}
                </div>
                {assignerGroups.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {assignerGroups.map((g) => g.name).join(", ")}
                  </div>
                )}
              </div>
            </div>

            {/* Arrow divider with status-based theme */}
            <div className="justify-self-center">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1",
                  statusStyle.theme
                )}
              >
                assigns&nbsp;to
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-2 justify-self-end">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {assigneeInitials}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <div className="font-medium">
                  {task.assignedUser?.name ?? "Unassigned"}
                </div>
                {assigneeGroups.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {assigneeGroups.map((g) => g.name).join(", ")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Due date + View Log (same line) */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <div className="flex items-center gap-2">
              <span>Due:</span>
              {isScheduled ? (
                <Badge
                  variant="secondary"
                  className="bg-rose-100 text-rose-700 ring-1 ring-rose-200 font-medium"
                >
                  {dueText}
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 font-medium"
                >
                  {dueText}
                </Badge>
              )}
            </div>

            <TaskLogModal
              eventId={eventId!}
              taskId={task.id}
              triggerLabel="View Task Log"
            />
          </div>

          {/* Role-aware status line */}
          {statusText && (
            <div
              className={cn(
                "px-3 py-2 rounded-md text-xs font-medium border ring-1",
                statusStyle?.theme
              )}
            >
              {statusText}
            </div>
          )}

          {/* Dynamic actions (buttons) */}
          {isParticipant &&
            (() => {
              // Which actions we actually render in this card (keeps order)
              const items = actions;

              const cols = Math.min(items.length || 1, 3);

              return (
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  }}
                >
                  {items.map((a) => {
                    // UPDATE → open update-only modal (fill cell, equal height)
                    if (a.value === TaskActionEnum.UPDATE && canOpenUpdate) {
                      return (
                        <Tooltip key={a.value}>
                          <TooltipTrigger asChild>
                            {/* Make the internal DialogTrigger button fill this cell */}
                            <div className="w-full [&>button]:w-full [&>button]:h-10">
                              <TaskConfigUpdateFormModal
                                eventId={eventId ?? ""}
                                taskId={task.id}
                                onRefresh={onRefresh}
                                initial={{
                                  name: task.name ?? "",
                                  description: task.description ?? "",
                                  startTime: task.startTime
                                    ? new Date(task.startTime)
                                    : undefined,
                                  endTime: task.endTime
                                    ? new Date(task.endTime)
                                    : undefined,
                                }}
                                triggerLabel={a.label}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[260px]">
                            <p className="text-xs whitespace-pre-line">
                              {a.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    // ASSIGN → placeholder for now (still occupies a grid cell)
                    if (a.value === TaskActionEnum.ASSIGN && eventId) {
                      return (
                        <Tooltip key={a.value}>
                          <TooltipTrigger asChild>
                            {/* Make the internal DialogTrigger button fill this cell */}
                            <div className="w-full [&>button]:w-full [&>button]:h-10">
                              <TaskReassignModal
                                key={a.value}
                                eventId={eventId}
                                taskId={task.id}
                                onRefresh={onRefresh}
                                options={assignableMembers}
                                initialUserId={task.assignedUser?.id ?? ""}
                                trigger={
                                  <button className="btn w-full sm:w-auto h-10 rounded-md px-4 border">
                                    {a.label}
                                  </button>
                                }
                                triggerLabel={a.label}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[260px]">
                            <p className="text-xs whitespace-pre-line">
                              {a.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    // DELETE → destructive
                    if (a.value === TaskActionEnum.DELETE) {
                      return (
                        <Tooltip key={a.value}>
                          <TooltipTrigger asChild>
                            <Button
                              className="w-full h-10"
                              variant="destructive"
                              onClick={onDelete}
                              disabled={loading}
                              aria-label="Delete task"
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              {a.label}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[260px]">
                            <p className="text-xs whitespace-pre-line">
                              {a.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    // Instant backend actions (ACCEPT/REJECT/SUBMIT/BLOCK/APPROVE)
                    return (
                      <Tooltip key={a.value}>
                        <TooltipTrigger asChild>
                          <Button
                            className="w-full h-10"
                            variant="outline"
                            onClick={() =>
                              runInstantAction(a.value as AllowAction)
                            }
                            disabled={loading}
                          >
                            {a.label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px]">
                          <p className="text-xs whitespace-pre-line">
                            {a.description}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              );
            })()}

          {/* If no eventId, hint why update is disabled (only when update would be allowed) */}
          {!canOpenUpdate &&
            actions.some((a) => a.value === TaskActionEnum.UPDATE) && (
              <p className="text-[11px] text-muted-foreground">
                Event context missing — update action is disabled.
              </p>
            )}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
