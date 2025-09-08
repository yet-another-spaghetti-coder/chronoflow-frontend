import { useAuthStore } from "@/lib/auth-store";
import { http } from "@/lib/http";
import { decodeExp } from "@/lib/auth";
import type { User, AuthCredentials } from "@/lib/type";
import type { LoginUser } from "@/lib/validation/schema";

let refreshing: Promise<boolean> | null = null;

function setAuthFromServer(payload: AuthCredentials) {
  const s = useAuthStore.getState();
  const exp =
    payload.accessTokenExpireTime ?? decodeExp(payload.accessToken) ?? null;

  const credentials: AuthCredentials = {
    user: (payload.user ?? s.user) as User,
    accessToken: payload.accessToken,
    accessTokenExpireTime: exp ?? undefined,
  };

  s.setAuth(credentials);
}

export async function login(credentials: LoginUser) {
  const res = await http.post("/system/auth/login", credentials);

  const { user, accessToken, accessTokenExpireTime } = res.data.data;

  setAuthFromServer({
    user,
    accessToken,
    accessTokenExpireTime,
  });

  return res.data;
}

export async function logout() {
  try {
    await http.post("/system/auth/logout", {});
  } catch {
    // ignore network errors
  } finally {
    useAuthStore.getState().clear();
  }
}

export function refresh(): Promise<boolean> {
  if (refreshing) return refreshing;

  refreshing = (async () => {
    try {
      const r = await http.post("/system/auth/refresh", {});

      const data = r.data;

      const { accessToken, accessTokenExpireTime, user } = data.data;

      setAuthFromServer({
        user,
        accessToken,
        accessTokenExpireTime,
      });
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

export async function ensureValidAccessToken(): Promise<string | null> {
  const s = useAuthStore.getState();
  return s.accessToken ?? null;
}
