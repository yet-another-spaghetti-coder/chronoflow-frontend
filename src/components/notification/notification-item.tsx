import { cn } from "@/lib/utils";
import type { NotificationFeed } from "@/lib/validation/schema";
import { timeAgo } from "@/lib/utils";

type Props = {
  item: NotificationFeed;
  onOpen: (item: NotificationFeed) => void;
  className?: string;
  onNavigate?: (href: string) => void;
};

export function NotificationItem({ item, onOpen, className }: Props) {
  const unread = !item.openedAt;

  const derivedBody =
    item.type === "new-task-assigned" && item.data
      ? (() => {
          const d = item.data as Record<string, unknown>;
          const taskName = typeof d.taskName === "string" ? d.taskName : "a task";
          const assignerName = typeof d.assignerName === "string" ? d.assignerName : "someone";
          const eventName = typeof d.eventName === "string" ? d.eventName : "an event";
          return `You have been assigned to the task "${taskName}" by ${assignerName} for ${eventName}.`;
        })()
      : item.body ?? "";

  return (
    <li>
      <button
        className={cn(
          "w-full text-left p-3 hover:bg-accent/50 transition",
          unread ? "bg-accent/30" : "bg-background",
          className
        )}
        onClick={() => onOpen(item)}
        aria-label={item.title ?? item.type ?? "Notification"}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-1 h-2 w-2 rounded-full",
              unread ? "bg-primary" : "bg-muted"
            )}
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium break-words">
                {item.title ?? item.type ?? "Notification"}
              </p>
              <span className="text-xs text-muted-foreground shrink-0">
                {item.createdAt ? timeAgo(item.createdAt) : ""}
              </span>
            </div>

            {derivedBody && (
              <p className="mt-1 text-sm text-muted-foreground break-words whitespace-pre-wrap">
                {derivedBody}
              </p>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}