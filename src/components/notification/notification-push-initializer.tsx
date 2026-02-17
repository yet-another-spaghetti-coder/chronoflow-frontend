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

      const supported = await isFcmSupported();
      if (!supported) {
        console.warn("[FCM] Not supported in this browser.");
        return;
      }

      const cacheKey = `fcm_token_${user.id}`;

      const persistAndRegister = async (token: string) => {
        const cached = localStorage.getItem(cacheKey);
        if (cached === token) return;

        localStorage.setItem(cacheKey, token);

        try {
          await registerDevice({ token });
        } catch (err) {
          console.error("[FCM] Backend register failed:", err);
        }
      };

      const fetchAndRegister = async () => {
        const token = await getFcmToken(vapidKey);
        if (token) await persistAndRegister(token);
      };

      // If already granted: register immediately (covers token rotation too)
      if (Notification.permission === "granted") {
        await fetchAndRegister();
        return;
      }

      // If denied: stop (don’t annoy user)
      if (Notification.permission === "denied") {
        console.warn("[FCM] Notifications previously denied.");
        return;
      }

      // Ask after first user gesture (browser requirement)
      const onFirstInteraction = async () => {
        cleanupGestureListeners();

        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") await fetchAndRegister();
        } catch (err) {
          console.error("[FCM] Permission/token flow error:", err);
        }
      };

      const cleanupGestureListeners = () => {
        window.removeEventListener("click", onFirstInteraction);
        window.removeEventListener("keydown", onFirstInteraction);
        window.removeEventListener("scroll", onFirstInteraction);
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

      // Optional cleanup (nice-to-have)
      return () => {
        // Best-effort: remove if still attached
        window.removeEventListener("click", onFirstInteraction);
        window.removeEventListener("keydown", onFirstInteraction);
        window.removeEventListener("scroll", onFirstInteraction);
      };
    })();
  }, [user?.id, vapidKey]);

  return null;
}
