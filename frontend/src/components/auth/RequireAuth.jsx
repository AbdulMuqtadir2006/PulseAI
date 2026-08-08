import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { RouteFallback } from "../ui/RouteFallback";

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <RouteFallback />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
