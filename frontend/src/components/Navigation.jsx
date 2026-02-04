import { Link, useLocation } from "react-router-dom";

export default function Navigation({ user }) {
  const role = (user?.role || "").toUpperCase();
  const { pathname } = useLocation();

  const linkClass = (path) =>
    `px-3 py-1 rounded ${
      pathname === path
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-blue-50"
    }`;

  return (
    <nav className="flex gap-3 text-sm bg-white shadow p-3 rounded">
      {role === "MANAGER" && (
        <Link to="/dashboard" className={linkClass("/dashboard")}>
          Dashboard
        </Link>
      )}

      <Link to="/orders" className={linkClass("/orders")}>
        Orders
      </Link>

      {(role === "CASHIER" || role === "MANAGER") && (
        <Link to="/payments" className={linkClass("/payments")}>
          Payments
        </Link>
      )}

      {role === "MANAGER" && (
        <Link to="/reports" className={linkClass("/reports")}>
          Reports
        </Link>
      )}
    </nav>
  );
}
