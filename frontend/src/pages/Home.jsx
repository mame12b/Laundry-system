import { Link } from "react-router-dom";

export default function Home({ user }) {
  const role = (user?.role || "").toUpperCase();

  const canPayments = role === "MANAGER" || role === "CASHIER";
  const canReports = role === "MANAGER";
  const canDashboard = role === "MANAGER";
  const canCreateOrder = role === "COLLECTOR" || role === "MANAGER";

  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold">Home</h1>
      <p className="text-sm sm:text-base text-gray-600 mt-1">
        Welcome back, <span className="font-medium">{user?.name}</span>. Choose what you want to do.
      </p>

      {/* Actions */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {canDashboard && (
          <Link
            to="/dashboard"
            className="btn-primary w-full text-center py-3 sm:py-2"
          >
            Go to Dashboard
          </Link>
        )}

        <Link
          to="/orders"
          className="btn-secondary w-full text-center py-3 sm:py-2"
        >
          View Orders
        </Link>

        {canCreateOrder && (
          <Link
            to="/orders/new"
            className="btn-primary w-full text-center py-3 sm:py-2"
          >
            Create Order
          </Link>
        )}

        {canPayments && (
          <Link
            to="/payments"
            className="btn-secondary w-full text-center py-3 sm:py-2"
          >
            Payments
          </Link>
        )}

        {canReports && (
          <Link
            to="/reports"
            className="btn-secondary w-full text-center py-3 sm:py-2"
          >
            Reports
          </Link>
        )}
      </div>
    </div>
  );
}
