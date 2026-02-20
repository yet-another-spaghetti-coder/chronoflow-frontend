import { create } from "zustand";
import type { NotificationDetailRespDTO } from "@/lib/validation/schema";
import { getNotificationDetail } from "@/api/notificationApi";

export type NotifModalState = {
  open: boolean;
  notifId: string | null;
  loading: boolean;
  detail: NotificationDetailRespDTO | null;
  error: string | null;

  openModal: (notifId: string) => void;
  closeModal: () => void;
  openAndFetch: (notifId: string) => Promise<void>;
};

export const useNotifModalStore = create<NotifModalState>((set, get) => ({
  open: false,
  notifId: null,
  loading: false,
  detail: null,
  error: null,

  openModal: (notifId) =>
    set({ open: true, notifId, loading: true, detail: null, error: null }),

  closeModal: () =>
    set({ open: false, notifId: null, loading: false, detail: null, error: null }),

  openAndFetch: async (notifId: string) => {
    get().openModal(notifId);

    try {
      const detail = await getNotificationDetail(notifId);
      console.log("[notif] detail parsed:", detail);
      set({ detail, loading: false, error: null });
    } catch (e: any) {
      console.error("[notif] failed:", e);
      const zodIssues = e?.issues?.map((x: any) => `${x.path?.join(".")}: ${x.message}`)?.join(" | ");
      set({
        error: zodIssues || e?.message || "An unexpected error occurred",
        loading: false,
        detail: null,
      });
    }
  },
}));