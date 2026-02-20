/* public/firebase-messaging-sw.js */

// Firebase compat libraries
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js");
importScripts("/firebase-config.js");

// Init firebase in SW
firebase.initializeApp(self.FIREBASE_CONFIG);
const messaging = firebase.messaging();

// Background push handler (FCM)
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] onBackgroundMessage payload:", payload);

  const data = payload?.data ?? {};
  const notifId = data.notifId || data.notif_id || data.id || null;

  const title = payload?.notification?.title ?? "Notification";
  const options = {
    body: payload?.notification?.body ?? "",
    icon: payload?.notification?.image ?? "/logo192.png",
    // Put notifId into notification.data so click handler can read it
    data: { ...data, notifId },
    // Optional: prevents stacking duplicates for same notif
    tag: notifId ? `notif-${notifId}` : undefined,
  };

  self.registration.showNotification(title, options);
});

// Click handler → open/focus app and pass notifId via URL
self.addEventListener("notificationclick", (event) => {
  event.notification?.close();

  const rawData = event.notification?.data || {};
  const notifId = rawData.notifId || rawData.notif_id || rawData.id || null;

  console.log("[SW] notificationclick notifId=", notifId, "rawData=", rawData);

  event.waitUntil(
    (async () => {
      // Build URL: /?openNotif=1&notifId=xxx
      const url = new URL("/", self.location.origin);
      url.searchParams.set("openNotif", "1");
      if (notifId) url.searchParams.set("notifId", String(notifId));

      console.log("[SW] target url=", url.toString());

      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Find any client belonging to this origin
      const existing = allClients.find((c) => {
        try {
          return new URL(c.url).origin === self.location.origin;
        } catch {
          return false;
        }
      });

      if (existing) {
        await existing.focus();
        // navigate the existing tab so React can read query params
        await existing.navigate(url.toString());
        return;
      }

      // else open new tab
      await clients.openWindow(url.toString());
    })()
  );
});