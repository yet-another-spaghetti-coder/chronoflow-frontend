import { useNotifModalStore } from "@/stores/notifModalStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "./badge";

function formatDateTime(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v; 
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationDetailModal() {
  const open = useNotifModalStore((s) => s.open);
  const loading = useNotifModalStore((s) => s.loading);
  const detail = useNotifModalStore((s) => s.detail);
  const error = useNotifModalStore((s) => s.error);
  const closeModal = useNotifModalStore((s) => s.closeModal);

  const task = detail?.task;
  const event = detail?.event;
  const actor = detail?.actor;

  // you said endTime is the deadline
  const deadline = task?.endTime ?? null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeModal()}>
      <DialogContent className="max-w-[720px] p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Notification</DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                <Badge variant="secondary">NEW</Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>

        <Separator />

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {loading && (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              Loading…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && detail && (
            <>
              {/* Assigned by + Event */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Assigned by
                  </div>
                  <div className="font-medium">{actor?.name ?? "Unknown"}</div>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Event
                  </div>
                  <div className="font-medium">{event?.name ?? "—"}</div>
                </div>
              </div>

              {/* Task */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Task</div>
                    <div className="text-lg font-semibold leading-snug">
                      {task?.name ?? "—"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      Deadline
                    </div>
                    <div className="font-medium">
                      {formatDateTime(deadline)}
                    </div>
                  </div>
                </div>

                {/* Description: light gray */}
                {task?.description ? (
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {task.description}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">—</div>
                )}

                {/* Remark: label + value in red; if missing show "-" */}
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-xs text-red-600 mb-1">Remark</div>
                  <div className="text-sm text-red-700 whitespace-pre-wrap">
                    {task?.remark?.trim() ? task.remark : "—"}
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      Start time
                    </div>
                    <div className="text-sm font-medium">
                      {formatDateTime(task?.startTime)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      End time
                    </div>
                    <div className="text-sm font-medium">
                      {formatDateTime(task?.endTime)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Footer */}
        <div className="px-6 py-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={closeModal}>
            Close
          </Button>

          <Button
            onClick={() => {
              const eventId = task?.eventId ?? event?.id;
              if (eventId) {
                window.location.assign(`/event/${eventId}/tasks`);
              }
              closeModal();
            }}
            disabled={!(task?.eventId ?? event?.id)}
          >
            View task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
