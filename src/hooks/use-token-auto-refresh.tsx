import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { refresh } from "@/api/authApi";

type Options = { bufferMs?: number };

export function useTokenAutoRefresh(options?: Options) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const accessTokenExpireTime = useAuthStore((s) => s.accessTokenExpireTime);
  const timerRef = useRef<number | null>(null);
  const lastFocusRunRef = useRef(0);

  const DEFAULT_BUFFER_MS = 30_000;
  const envBuf = Number(import.meta.env.VITE_TOKEN_REFRESH_BUFFER);
  const configuredBuffer =
    typeof options?.bufferMs === "number"
      ? options.bufferMs
      : Number.isFinite(envBuf)
      ? Math.max(0, envBuf)
      : DEFAULT_BUFFER_MS;

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!accessToken || !accessTokenExpireTime) return;

    const expiryMs = accessTokenExpireTime * 1000;
    const delay = Math.max(0, expiryMs - Date.now() - configuredBuffer);

    if (delay <= 0) {
      void refresh();
      return;
    }

    timerRef.current = window.setTimeout(() => {
      // check again before refreshing
      if (useAuthStore.getState().accessToken) {
        void refresh();
      }
    }, delay);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [accessToken, accessTokenExpireTime, configuredBuffer]);

  useEffect(() => {
    const onFocusOrVisible = async () => {
      const now = Date.now();
      if (now - lastFocusRunRef.current < 1000) return;
      lastFocusRunRef.current = now;

      const { accessToken: t, accessTokenExpireTime: exp } =
        useAuthStore.getState();
      if (!t || !exp) return;

      const withinBuffer = exp * 1000 <= Date.now() + configuredBuffer;
      if (withinBuffer) {
        await refresh();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void onFocusOrVisible();
      }
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [configuredBuffer]);
}
