import { useEffect } from "react";
import {
  initFirebase,
  getFcmToken,
  isFcmSupported,
} from "@/lib/firebase/firebaseUtils";
import { useAuthStore } from "@/stores/authStore";
import { registerDevice } from "@/api/pushNotiApi";

export function NotificationInitializer() {
  const user = useAuthStore((s) => s.user);
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;

  useEffect(() => {
    initFirebase();
  }, []);

  useEffect(() => {
    (async () => {
      if (!user?.id || !vapidKey) return;
      if (!(await isFcmSupported())) return;

      const cacheKey = `fcm_token_${user.id}`;

      const persistAndRegister = async (token: string) => {
        const cached = localStorage.getItem(cacheKey);
        if (cached === token) return; // no-op
        localStorage.setItem(cacheKey, token);
        try {
          await registerDevice({ userId: user.id, token });
        } catch (err) {
          console.error("[FCM] Backend register failed:", err);
        }
      };

      const fetchAndRegister = async () => {
        try {
          const token = await getFcmToken(vapidKey);
          if (token) await persistAndRegister(token);
        } catch (err) {
          console.error("[FCM] getFcmToken error:", err);
        }
      };

      // 1) If already granted: get/refresh now (covers rotation too)
      if (Notification.permission === "granted") {
        await fetchAndRegister();
        return;
      }

      // 2) If denied: bail out
      if (Notification.permission === "denied") {
        console.warn("[FCM] Notifications previously denied.");
        return;
      }

      // 3) Default: ask after first user gesture
      const onFirstInteraction = async () => {
        window.removeEventListener("click", onFirstInteraction);
        window.removeEventListener("keydown", onFirstInteraction);
        window.removeEventListener("scroll", onFirstInteraction);
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") await fetchAndRegister();
        } catch (err) {
          console.error("[FCM] Permission/token flow error:", err);
        }
      };

      const armGestureListeners = () => {
        window.addEventListener("click", onFirstInteraction, { once: true });
        window.addEventListener("keydown", onFirstInteraction, { once: true });
        window.addEventListener("scroll", onFirstInteraction, { once: true });
      };

      if (document.visibilityState === "visible") {
        armGestureListeners();
      } else {
        const onVisible = () => {
          document.removeEventListener("visibilitychange", onVisible);
          armGestureListeners();
        };
        document.addEventListener("visibilitychange", onVisible, {
          once: true,
        });
      }
    })();
  }, [user?.id, vapidKey]);

  return null;
}
