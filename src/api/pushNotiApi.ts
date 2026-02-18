import { http } from "@/lib/http";
import {
  PushNotificationDeviceRegistrationSchema,
  RevokeDeviceByTokenSchema,
  type PushNotificationDeviceRegistration,
} from "@/lib/validation/schema";

export function getOrCreateDeviceId(): string {
  const key = "push_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export async function registerDevice(
  input: PushNotificationDeviceRegistration,
): Promise<void> {
  const parsed = PushNotificationDeviceRegistrationSchema.parse(input);

  const body: Record<string, unknown> = {
    token: parsed.token.trim(),
    deviceId: parsed.deviceId.trim(),
  };
  if (parsed.platform) body.platform = parsed.platform;

  try {
    await http.post(`/notifications/push/devices/register`, body);
  } catch (err: unknown) {
    let msg = "Unknown error";
    const axiosLike = (err as { response?: { data?: unknown } })?.response
      ?.data;
    if (typeof axiosLike === "string") {
      msg = axiosLike;
    } else if (
      axiosLike &&
      typeof axiosLike === "object" &&
      "message" in axiosLike
    ) {
      const maybeMsg = (axiosLike as { message?: unknown }).message;
      if (typeof maybeMsg === "string") msg = maybeMsg;
    } else if (err instanceof Error) {
      msg = err.message;
    }
    console.error("[FCM] Device registration failed:", msg);
    throw err;
  }
}

export async function revokeSelf(deviceId: string): Promise<void> {
  await http.post(`/notifications/push/devices/revoke-self`, { deviceId });
}

export async function revokeAllDevicesForUser(): Promise<void> {
  try {
    await http.post(`/notifications/push/devices/revoke-all`);
  } catch (err: unknown) {
    let msg = "Unknown error";
    const axiosLike = (err as { response?: { data?: unknown } })?.response
      ?.data;
    if (typeof axiosLike === "string") {
      msg = axiosLike;
    } else if (
      axiosLike &&
      typeof axiosLike === "object" &&
      "message" in axiosLike
    ) {
      const maybeMsg = (axiosLike as { message?: unknown }).message;
      if (typeof maybeMsg === "string") msg = maybeMsg;
    } else if (err instanceof Error) {
      msg = err.message;
    }
    console.error("[FCM] Revoke all devices for user failed:", msg);
    throw err;
  }
}


