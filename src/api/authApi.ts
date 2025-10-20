import { useAuthStore } from "@/stores/authStore";
import { http } from "@/lib/http";
import type { User, AuthCredentials } from "@/lib/auth-type";
import type { LoginUser } from "@/lib/validation/schema";
import { unwrap } from "@/lib/utils";
import { deleteFcmToken } from "@/lib/firebase/firebaseUtils";
import { revokeDeviceByToken } from "./pushNotiApi";

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
  const cacheKey = user?.id ? `fcm_token_${user.id}` : "fcm_token_unknown";
  const token = localStorage.getItem(cacheKey);

  try {
    // Tell backend to revoke the FCM device (best effort)
    if (token) {
      try {
        await revokeDeviceByToken(token);
        console.log("[Logout] Device revoked on backend");
      } catch (e) {
        console.warn("[Logout] Failed to revoke device:", e);
      }
    }

    // Delete FCM token from Firebase (client side)
    try {
      await deleteFcmToken();
      console.log("[Logout] FCM token deleted locally");
    } catch (e) {
      console.warn("[Logout] Failed to delete FCM token:", e);
    }

    //Tell your backend to log out session
    await http.post("/users/system/auth/logout", {});
  } catch (e) {
    console.warn("[Logout] Logout request failed:", e);
  } finally {
    //Clean up local cache + user store regardless
    localStorage.removeItem(cacheKey);
    useAuthStore.getState().clear();
    console.log("[Logout] Local state cleared");
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
