import { RouterProvider } from "react-router-dom";
import router from "./router/route";
import { useEffect, useState } from "react";
import Cookie from "js-cookie";

import { refresh, refreshMobile } from "./api/authApi";
import { useSessionKeepAlive } from "@/hooks/system/useSessionKeepAlive";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import type { MobileStatus } from "./lib/auth-type";
import { useNotifClickListener } from "@/hooks/push/useNotifClickListener";
import { NotificationDetailModal } from "@/components/ui/NotificationDetailModal";

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [mobileStatus, setMobileStatus] = useState<MobileStatus>({
    isMobile: false,
    errStatus: false,
  });

  useEffect(() => {
    (async () => {
      const jwt = Cookie.get("token");

      if (jwt) {
        // Mobile path
        try {
          await refreshMobile(jwt);
          setMobileStatus({ isMobile: true, errStatus: false });
        } catch (err) {
          console.error("Mobile refresh failed", err);
          setMobileStatus({ isMobile: true, errStatus: true });
        }
      } else {
        // Web path
        try {
          await refresh();
        } catch {
          // ignore: not logged in
        }
      }

      setReady(true);
    })();
  }, []);

  if (!mobileStatus.isMobile) {
    return ready ? <>{children}</> : null;
  }

  return mobileStatus.errStatus ? null : <>{children}</>;
}

export default function App() {
  // Keep session alive
  useSessionKeepAlive({ intervalMs: 10 * 60 * 1000, runOnInit: true });

  // Must be global so it works no matter which page is open
  useNotifClickListener();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Must be global */}
      <NotificationDetailModal />

      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}