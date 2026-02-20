import { useAuthStore } from "@/stores/authStore";
import { http } from "@/lib/http";
import type { User, AuthCredentials } from "@/lib/auth-type";
import type { LoginUser } from "@/lib/validation/schema";
import { unwrap } from "@/lib/utils";
import { deleteFcmToken } from "@/lib/firebase/firebaseUtils";
import { revokeSelf } from "./pushNotiApi";

let refreshing: Promise<boolean> | null = null;

function setAuthFromServer(payload: AuthCredentials) {
  const s = useAuthStore.getState();
  const credentials: AuthCredentials = {
    user: (payload.user ?? s.user) as User,
  };
  s.setAuth(credentials);
}

export async function login(credentials: LoginUser): Promise<AuthCredentials> {
  const res = await http.post("/users/auth/login", credentials);
  const data = unwrap<AuthCredentials>(res.data);
  if (data.user) {
    setAuthFromServer({ user: data.user });
  }
  return data;
}

export async function logout() {
  const user = useAuthStore.getState().user;
  const deviceId = localStorage.getItem("push_device_id");
  const cacheKey =
    user?.id && deviceId ? `fcm_token_hash_${user.id}_${deviceId}` : null;

  try {
    if (deviceId) {
      try {
        await revokeSelf(deviceId);
      } catch (e) {
        console.warn("[Logout] Failed to revoke device:", e);
      }
    }

    try {
      await deleteFcmToken(); // Firebase SDK deletes the current registration token
    } catch (e) {
      console.warn("[Logout] Failed to delete FCM token:", e);
    }

    await http.post("/users/auth/logout", {});
  } finally {
    if (cacheKey) localStorage.removeItem(cacheKey);

    // keep push_device_id
    useAuthStore.getState().clear();
  }
}

export function refresh(): Promise<boolean> {
  if (refreshing) return refreshing;

  refreshing = (async () => {
    try {
      const r = await http.post("/users/auth/refresh", {});
      const { user } = r.data?.data ?? {};
      if (user) setAuthFromServer({ user });
      return true;
    } catch {
      useAuthStore.getState().clear();
      return false;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}

export function refreshMobile(token: string): Promise<boolean> {
  if (refreshing) return refreshing;

  refreshing = (async () => {
    try {
      const r = await http.post("/users/auth/validateOTT", token);
      const { user } = r.data?.data ?? {};
      if (user) setAuthFromServer({ user });
      return true;
    } catch {
      useAuthStore.getState().clear();
      return false;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}
