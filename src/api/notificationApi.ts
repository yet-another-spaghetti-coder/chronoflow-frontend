import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";
import { notificationDetailSchema, type NotificationDetailRespDTO } from "@/lib/validation/schema";

export async function getNotificationDetail(
  notifId: string
): Promise<NotificationDetailRespDTO> {
  const res = await http.get(`/notifications/${encodeURIComponent(notifId)}`);
  const raw = unwrap<NotificationDetailRespDTO>(res.data);
  return notificationDetailSchema.parse(raw);
}