import { useEffect } from "react";
import { useNotifModalStore } from "@/stores/notifModalStore";

function readOpenNotifFromUrl(): string | null {
  const sp = new URLSearchParams(window.location.search);
  const openNotif = sp.get("openNotif");
  const notifId = sp.get("notifId");
  if (openNotif === "1" && notifId) return notifId;
  return null;
}

function clearNotifParams() {
  const clean =
    window.location.pathname +
    (window.location.hash ? window.location.hash : "");
  window.history.replaceState({}, "", clean);
}

export function useNotifClickListener() {
  const openAndFetch = useNotifModalStore((s) => s.openAndFetch);

  useEffect(() => {
    // A) URL-based open (works with SW navigate/openWindow)
    const tryOpenFromUrl = () => {
      const notifId = readOpenNotifFromUrl();
      if (!notifId) return;
      openAndFetch(notifId);
      clearNotifParams();
    };

    // run on first load
    tryOpenFromUrl();

    // handle back/forward navigation
    const onPop = () => tryOpenFromUrl();
    window.addEventListener("popstate", onPop);

    // B) (optional) message-based open (older SW postMessage)
    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type !== "OPEN_NOTIF_MODAL") return;
      const notifId = event.data?.notifId as string | undefined;
      if (!notifId) return;
      openAndFetch(notifId);
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onSwMessage);
    }

    return () => {
      window.removeEventListener("popstate", onPop);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onSwMessage);
      }
    };
  }, [openAndFetch]);
}