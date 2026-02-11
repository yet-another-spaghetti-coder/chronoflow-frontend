import { RouterProvider } from "react-router-dom";
import router from "./router/route";
import { useEffect, useState } from "react";
import {
  refresh,
  refreshMobile,
} from "./api/authApi";
import { useSessionKeepAlive } from "@/hooks/system/useSessionKeepAlive";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Cookie from "js-cookie";
import type { MobileStatus } from "./lib/auth-type";
function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [mobileStatus, setMobileStatus] = useState<MobileStatus>({
    isMobile: false,
    errStatus: false
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
          // ignore; user just isn't logged in
        }
      }
      
      setReady(true);
    })();
  }, []); // Only run once on mount

  if (!mobileStatus.isMobile) {
    return ready ? <>{children}</> : null;
  } else {
    return mobileStatus.errStatus ? null : <>{children}</>;
  }
}

export default function App() {
  // Periodic session keep-alive; bootstrap already did the first refresh.
  useSessionKeepAlive({ intervalMs: 10 * 60 * 1000, runOnInit: true });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
