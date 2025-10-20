import { http } from "@/lib/http";
import {
  PushNotificationDeviceRegistrationSchema,
  RevokeAllDevicesForUserSchema,
  RevokeDeviceByTokenSchema,
  type PushNotificationDeviceRegistration,
} from "@/lib/validation/schema";

export async function registerDevice(
  input: PushNotificationDeviceRegistration
): Promise<void> {
  const parsed = PushNotificationDeviceRegistrationSchema.parse(input);
  const qs = new URLSearchParams({ userId: parsed.userId }).toString();

  const body: Record<string, unknown> = { token: parsed.token.trim() };
  if (parsed.platform) body.platform = parsed.platform;

  try {
    await http.post(`/notifications/push/devices/register?${qs}`, body);
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

export async function revokeDeviceByToken(token: string): Promise<void> {
  const { token: t } = RevokeDeviceByTokenSchema.parse({ token });
  const qs = new URLSearchParams({ token: t.trim() }).toString();

  try {
    await http.post(`/notifications/push/devices/revoke?${qs}`);
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
    console.error("[FCM] Device revocation failed:", msg);
    throw err;
  }
}

export async function revokeAllDevicesForUser(userId: string): Promise<void> {
  const { userId: id } = RevokeAllDevicesForUserSchema.parse({ userId });
  const qs = new URLSearchParams({ userId: id }).toString();

  try {
    await http.post(`/notifications/push/devices/revoke-all?${qs}`);
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
