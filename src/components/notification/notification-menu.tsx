import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useNotificationFeed } from "@/hooks/notification-feeds/useNotificationFeed";
import { markNotificationsOpened } from "@/api/feedNotiApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationFeed } from "@/lib/validation/schema";
import { useAuthStore } from "@/stores/authStore";
import { NotificationItem } from "@/components/notification/notification-item";

type Props = {
  userId?: string;
  limit?: number;
  onNavigate?: (href: string) => void;
};

export function NotificationMenu({
  userId: userIdProp,
  limit = 20,
  onNavigate,
}: Props) {
  const storeUserId = useAuthStore((s) => s.user?.id);
  const userId = userIdProp ?? storeUserId ?? "";
  const qc = useQueryClient();

  const { feed, unread, loading, onRefresh, error } = useNotificationFeed(
    userId,
    limit
  );

  const openOne = React.useCallback(
    async (n: NotificationFeed) => {
      if (!userId) return;

      // optimistic: mark opened in feed cache (key matches hook: ["feed", userId, { limit }])
      qc.setQueryData<NotificationFeed[]>(["feed", userId, { limit }], (prev) =>
        (prev ?? []).map((x) =>
          x.id === n.id ? { ...x, openedAt: new Date().toISOString() } : x
        )
      );
      // optimistic: decrement unread if this was previously unopened
      qc.setQueryData<number>(["feed-unread", userId], (old) =>
        Math.max(0, (old ?? 0) - (n.openedAt ? 0 : 1))
      );

      try {
        await markNotificationsOpened(userId, [n.id]);
      } finally {
        await onRefresh();
      }

      const deepLink =
        n.data &&
        typeof (n.data as Record<string, unknown>).deepLink === "string"
          ? ((n.data as Record<string, unknown>).deepLink as string)
          : undefined;
      if (deepLink && onNavigate) onNavigate(deepLink);
    },
    [userId, limit, qc, onRefresh, onNavigate]
  );

  const openAll = React.useCallback(async () => {
    if (!userId || !feed.length) return;
    const ids = feed.filter((n) => !n.openedAt).map((n) => n.id);
    if (!ids.length) return;

    // optimistic: mark all opened
    qc.setQueryData<NotificationFeed[]>(["feed", userId, { limit }], (prev) =>
      (prev ?? []).map((x) =>
        !x.openedAt ? { ...x, openedAt: new Date().toISOString() } : x
      )
    );
    // optimistic: reduce unread by count we just opened
    qc.setQueryData<number>(["feed-unread", userId], (old) =>
      Math.max(0, (old ?? 0) - ids.length)
    );

    try {
      await markNotificationsOpened(userId, ids);
    } finally {
      await onRefresh();
    }
  }, [userId, limit, feed, qc, onRefresh]);

  const unreadBadge = unread > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
          disabled={!userId}
        >
          <Bell className="h-5 w-5" />
          {unreadBadge && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] rounded-full px-1 text-[10px] leading-5"
            >
              {unread > 99 ? "99+" : unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <DropdownMenuLabel className="flex items-center justify-between py-2 px-3">
          <span className="font-semibold">Notifications</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={openAll}
            disabled={loading || feed.length === 0}
          >
            Mark all opened
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {error && (
          <div className="px-3 py-2 text-xs text-red-600">
            Failed to load feed: {error}
          </div>
        )}

        <div className="p-0">
          {loading ? (
            <div className="p-3 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : feed.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              You’re all caught up ✨
            </div>
          ) : (
            <ScrollArea className="max-h-[420px]">
              <ul className="divide-y">
                {feed.map((n) => (
                  <NotificationItem key={n.id} item={n} onOpen={openOne} />
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}