import { useEffect, useRef } from "react";
import {
  initFirebase,
  getFcmToken,
  isFcmSupported,
} from "@/lib/firebase/firebaseUtils";
import { useAuthStore } from "@/stores/authStore";
import { getOrCreateDeviceId, registerDevice } from "@/api/pushNotiApi";
import { sha256Base64Url } from "@/lib/utils";

export function NotificationInitializer() {
  const user = useAuthStore((s) => s.user);
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;

  const inFlightRef = useRef<Promise<void> | null>(null);
  const armedRef = useRef(false);

  useEffect(() => {
    initFirebase();
  }, []);

  useEffect(() => {
    if (!user?.id || !vapidKey) return;

    let cancelled = false;

    const deviceId = getOrCreateDeviceId();
    const cacheKey = `fcm_token_hash_${user.id}_${deviceId}`;

    const persistAndRegister = async (token: string) => {
      const tokenHash = await sha256Base64Url(token);

      const cachedHash = localStorage.getItem(cacheKey);

      if (cachedHash === tokenHash) return;

      localStorage.setItem(cacheKey, tokenHash);

      await registerDevice({ token, deviceId, platform: "WEB" }); 
    };

    const fetchAndRegisterOnce = async () => {
      if (inFlightRef.current) return inFlightRef.current;

      inFlightRef.current = (async () => {
        const supported = await isFcmSupported();
        if (!supported || cancelled) return;

        const token = await getFcmToken(vapidKey);
        if (token && !cancelled) {
          await persistAndRegister(token);
        }
      })().finally(() => {
        inFlightRef.current = null;
      });

      return inFlightRef.current;
    };

    const onFirstInteraction = async () => {
      if (armedRef.current === false) return;
      armedRef.current = false;
      window.removeEventListener("pointerdown", onFirstInteraction);

      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") await fetchAndRegisterOnce();
      } catch (e) {
        console.error("[FCM] Permission/token flow error:", e);
      }
    };

    const arm = async () => {
      const supported = await isFcmSupported();
      if (!supported || cancelled) return;

      if (Notification.permission === "granted") {
        await fetchAndRegisterOnce();
        return;
      }
      if (Notification.permission === "denied") return;

      armedRef.current = true;
      window.addEventListener("pointerdown", onFirstInteraction, {
        once: true,
      });
    };

    arm();

    return () => {
      cancelled = true;
      armedRef.current = false;
      window.removeEventListener("pointerdown", onFirstInteraction);
    };
  }, [user?.id, vapidKey]);

  return null;
}
