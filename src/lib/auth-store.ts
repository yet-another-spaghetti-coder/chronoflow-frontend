import { create } from "zustand";
import type { AuthState, AuthCredentials } from "./type";
import { decodeExp } from "./auth";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  accessTokenExpireTime: null,

  setAuth: ({ user, accessToken, accessTokenExpireTime }: AuthCredentials) => {
    set({
      user,
      accessToken,
      accessTokenExpireTime:
        accessTokenExpireTime ?? decodeExp(accessToken) ?? null,
    });
  },

  clear: () => {
    set({ user: null, accessToken: null, accessTokenExpireTime: null });
  },

  isTokenValid: () => {
    const exp = get().accessTokenExpireTime;
    if (!exp) return false;

    const DEFAULT_BUFFER_MS = 30_000;
    const MAX_BUFFER_MS = 5 * 60_000;
    const SKEW_MS = 5_000;

    const raw = Number(import.meta.env.VITE_TOKEN_REFRESH_BUFFER);
    const buf = Number.isFinite(raw)
      ? Math.max(0, Math.min(raw, MAX_BUFFER_MS))
      : DEFAULT_BUFFER_MS;

    return exp * 1000 > Date.now() + buf - SKEW_MS;
  },
}));
