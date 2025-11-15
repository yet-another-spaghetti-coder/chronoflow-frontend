import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
  deleteToken,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let messagingPromise: Promise<Messaging | null>;

export function initFirebase(): void {
  if (!app) {
    app = initializeApp(firebaseConfig);
    messagingPromise = isSupported().then((ok) =>
      ok ? getMessaging(app!) : null
    );
  }
}

/** Must be called from a user gesture (click/tap) */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return Notification.requestPermission();
}

/** Ensure the messaging SW exists and is activated, then return it */
async function ensureSw(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker not supported");
  }

  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing?.active) return existing;

  const reg =
    existing ??
    (await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
      updateViaCache: "none",
    }));

  // If already active, done
  if (reg.active) return reg;

  // Otherwise wait until activated
  await new Promise<void>((resolve, reject) => {
    const sw = reg.installing || reg.waiting;
    if (!sw) return resolve();
    const onChange = () => {
      if (sw.state === "activated") {
        sw.removeEventListener("statechange", onChange);
        resolve();
      } else if (sw.state === "redundant") {
        sw.removeEventListener("statechange", onChange);
        reject(new Error("Service worker became redundant"));
      }
    };
    sw.addEventListener("statechange", onChange);
  });

  return reg;
}

export async function getFcmToken(vapidKey: string): Promise<string | null> {
  const messaging = await messagingPromise;
  if (!messaging) {
    console.warn("[FCM] Not supported in this browser/context.");
    return null;
  }
  if (!vapidKey) {
    console.warn("[FCM] Missing VAPID key.");
    return null;
  }
  if (Notification.permission !== "granted") {
    console.warn(
      "[FCM] Notification permission is not granted; skip getToken."
    );
    return null;
  }

  try {
    const swReg = await ensureSw();
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg,
    });
    return token || null;
  } catch (err) {
    console.error("[FCM] Error while retrieving token:", err);
    return null;
  }
}

export async function listenForMessages(
  callback: (payload: MessagePayload) => void
): Promise<void> {
  const messaging = await messagingPromise;
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    callback(payload);
  });
}

export async function isFcmSupported(): Promise<boolean> {
  return isSupported();
}

export async function deleteFcmToken(): Promise<boolean> {
  const messaging = await messagingPromise;
  if (!messaging) return false;
  try {
    const ok = await deleteToken(messaging);
    return ok;
  } catch (e) {
    console.warn("[FCM] deleteToken failed:", e);
    return false;
  }
}
