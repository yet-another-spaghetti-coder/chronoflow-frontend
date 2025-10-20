// Firebase core libraries (compat build for easy migration)
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js");
importScripts("/firebase-config.js");

// Initialize Firebase inside the SW
firebase.initializeApp(self.FIREBASE_CONFIG);
const messaging = firebase.messaging();

// --- Handle background messages ---
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message received:", payload);

  const title = payload.notification?.title ?? "Notification";
  const body = payload.notification?.body ?? "";
  const icon = payload.notification?.image ?? "/logo192.png";
  const data = payload.data ?? {};

  const options = {
    body,
    icon,
    data,
  };

  self.registration.showNotification(title, options);
});

// --- Optional: Handle notification click ---
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Focus existing tab if available
      const sameOrigin = allClients.find(
        (c) => new URL(c.url).origin === self.location.origin
      );

      if (sameOrigin) {
        await sameOrigin.focus();
        return;
      }

      // Otherwise, open app root
      await clients.openWindow("/");
    })()
  );
});