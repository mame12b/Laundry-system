import { Navigate } from "react-router-dom";

export default function RequireRole({ user, allow, children }) {
  if (!user) return <Navigate to="/login" replace />;

  const role = (user.role || "").toUpperCase();

  const ok = typeof allow === "function" ? allow(role) : true;

  if (!ok) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-bold text-red-600">Access denied</h2>
        <p className="text-sm text-gray-600 mt-1">
          You don’t have permission to access this page.
        </p>
      </div>
    );
  }

  return children;
}
