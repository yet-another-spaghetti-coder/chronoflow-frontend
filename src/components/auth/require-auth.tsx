import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";

export default function RequireAuth() {
  const user = useAuthStore((s) => s.user); 
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}