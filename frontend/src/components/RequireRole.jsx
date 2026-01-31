import { Navigate } from "react-router-dom";
import { normalizeRole } from "../utils/permissions";

export default function RequireRole({ user, allow, children }) {
  if (!user) return <Navigate to="/" replace />;

  const role = normalizeRole(user?.role);
  const ok = typeof allow === "function" ? allow(role) : true;

  if (!ok) return <Navigate to="/" replace />;

  return children;
}
