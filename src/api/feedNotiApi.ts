import { http } from "@/lib/http";
import {
  MarkOpenedRequestSchema,
  MarkOpenedResponseSchema,
  NotificationFeedListSchema,
  UnreadCountResponseSchema,
  type NotificationFeed,
} from "@/lib/validation/schema";

export async function getNotificationFeed(
  userId: string,
  limit = 20,
  beforeEpochMs?: number
): Promise<NotificationFeed[]> {
  const res = await http.get("/ws/feed", {
    params: {
      userId,
      limit,
      ...(beforeEpochMs !== undefined ? { beforeEpochMs } : {}),
    },
  });
  console.log("Fetched notification feed:", res.data);
  return NotificationFeedListSchema.parse(res.data);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const res = await http.get(`/ws/unread/${encodeURIComponent(userId)}`);
  return UnreadCountResponseSchema.parse(res.data).unread;
}

export async function markNotificationsOpened(
  userId: string,
  notificationIds: string[]
): Promise<number> {
  const body = MarkOpenedRequestSchema.parse({ userId, notificationIds });
  const res = await http.post("/ws/mark-opened", body);
  return MarkOpenedResponseSchema.parse(res.data).updated;
}
