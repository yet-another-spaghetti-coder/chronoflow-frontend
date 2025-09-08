import { RouterProvider } from "react-router-dom";
import router from "./router/route";
import { useEffect, useState } from "react";
import { refresh } from "./api/authApi";
import { useTokenAutoRefresh } from "@/hooks/use-token-auto-refresh";

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await refresh();
      setReady(true);
    })();
  }, []);
  if (!ready) return null;
  return <>{children}</>;
}

export default function App() {
  useTokenAutoRefresh();

  return (
    <AuthBootstrap>
      <RouterProvider router={router} />
    </AuthBootstrap>
  );
}
