import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { refresh } from "@/api/authApi";

type Options = { bufferMs?: number; minIntervalMs?: number };

export function useTokenAutoRefresh(options?: Options) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const accessTokenExpireTime = useAuthStore((s) => s.accessTokenExpireTime);

  const timerRef = useRef<number | null>(null);
  const lastFocusRunRef = useRef(0);
  const inflightRef = useRef<Promise<boolean> | null>(null);
  const lastRefreshAtRef = useRef(0);

  const DEFAULT_BUFFER_MS = 30_000;
  const DEFAULT_MIN_INTERVAL_MS = 5_000;

  const envBuf = Number(import.meta.env.VITE_TOKEN_REFRESH_BUFFER);
  const bufferMs =
    typeof options?.bufferMs === "number"
      ? options.bufferMs
      : Number.isFinite(envBuf)
      ? Math.max(0, envBuf)
      : DEFAULT_BUFFER_MS;

  const minIntervalMs =
    typeof options?.minIntervalMs === "number"
      ? options.minIntervalMs
      : DEFAULT_MIN_INTERVAL_MS;

  const refreshThrottled = async () => {
    const now = Date.now();
    if (now - lastRefreshAtRef.current < minIntervalMs) return false;

    if (!inflightRef.current) {
      inflightRef.current = refresh()
        .catch(() => false)
        .finally(() => {
          inflightRef.current = null;
          lastRefreshAtRef.current = Date.now();
        });
    }
    return inflightRef.current;
  };

  useEffect(() => {
    const clear = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    clear();

    if (!accessToken || !accessTokenExpireTime) return;

    const schedule = () => {
      const expiryMs = accessTokenExpireTime * 1000;

      const delay = Math.max(1000, expiryMs - Date.now() - bufferMs);

      timerRef.current = window.setTimeout(async () => {
        const { accessToken: t, accessTokenExpireTime: exp } =
          useAuthStore.getState();
        if (t && exp && exp * 1000 <= Date.now() + bufferMs) {
          await refreshThrottled();
        }
        schedule();
      }, delay);
    };

    schedule();
    return clear;
  }, [accessToken, accessTokenExpireTime, bufferMs, minIntervalMs]);

  useEffect(() => {
    const onFocusOrVisible = async () => {
      const now = Date.now();
      if (now - lastFocusRunRef.current < 1000) return;
      lastFocusRunRef.current = now;

      const { accessToken: t, accessTokenExpireTime: exp } =
        useAuthStore.getState();
      if (!t || !exp) return;

      if (exp * 1000 <= Date.now() + bufferMs) {
        await refreshThrottled();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void onFocusOrVisible();
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [bufferMs, minIntervalMs]);
}
