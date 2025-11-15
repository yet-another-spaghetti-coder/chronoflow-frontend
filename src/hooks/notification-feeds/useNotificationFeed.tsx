import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { useWebSocket } from "@/hooks/ws/useWebSocket";
import type { NotificationFeed } from "@/lib/validation/schema";
import { getNotificationFeed, getUnreadCount } from "@/api/feedNotiApi";

export type UseNotificationFeedType = {
  feed: NotificationFeed[];
  unread: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
};

export function useNotificationFeed(userIdProp?: string, limit = 20): UseNotificationFeedType {
  const storeUserId = useAuthStore((s) => s.user?.id);
  const userId = userIdProp ?? storeUserId ?? "";
  const enabled = !!userId;
  const qc = useQueryClient();

  // Live refetch on WS
  useWebSocket(userId);

  // FEED
  const feedQuery = useQuery<NotificationFeed[], Error>({
    queryKey: ["feed", userId, { limit }],
    queryFn: () => getNotificationFeed(userId, limit),
    enabled,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  // UNREAD
  const unreadQuery = useQuery<number, Error>({
    queryKey: ["feed-unread", userId],
    queryFn: () => getUnreadCount(userId),
    enabled,
    staleTime: 10_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const onRefresh = async () => {
    if (!userId) return;
    await Promise.all([
      qc.invalidateQueries({ predicate: q => {
        const k = q.queryKey as unknown[];
        return Array.isArray(k) && k[0] === "feed" && k[1] === userId;
      }}),
      qc.invalidateQueries({ queryKey: ["feed-unread", userId] }),
    ]);
  };

  return {
    feed: feedQuery.data ?? [],
    unread: unreadQuery.data ?? 0,
    loading: feedQuery.isFetching || unreadQuery.isFetching,
    error: feedQuery.error?.message ?? unreadQuery.error?.message ?? null,
    onRefresh,
  };
}