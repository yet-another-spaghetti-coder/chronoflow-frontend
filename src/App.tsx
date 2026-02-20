import { RouterProvider } from "react-router-dom";
import router from "./router/route";
import { useEffect, useState } from "react";
import { refresh, refreshMobile } from "./api/authApi";
import { useSessionKeepAlive } from "@/hooks/system/useSessionKeepAlive";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { initFirebase } from "@/lib/firebase/firebaseUtils";

// Initialize Firebase on app load
initFirebase();

import Cookie from 'js-cookie';
import type { MobileStatus } from "./lib/auth-type";
function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [mobileStatus, setMobileStatus] = useState<MobileStatus>({
    isMobile: false,
    errStatus: true
  });
  useEffect(() => {
    (async () => {
      const ott = Cookie.get("token");

      if (ott) {
        try {
          await refreshMobile(ott);
          setMobileStatus({ isMobile: true, errStatus: false });
        } catch {
          setMobileStatus({ isMobile: true, errStatus: true });
        }
      } else {
        try {
          // Hydrate user from cookie on app start
          await refresh();
        } catch {
          // ignore; user just isn't logged in
        }
        setReady(true);
      }


    })();
  }, []);

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
