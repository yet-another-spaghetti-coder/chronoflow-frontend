import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";

export default function RequireAuth() {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
