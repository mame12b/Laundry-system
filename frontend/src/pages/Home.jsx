import { Link } from "react-router-dom";

export default function Home({ user }) {
  const role = (user?.role || "").toUpperCase();

  const canPayments = role === "MANAGER" || role === "CASHIER";
  const canReports = role === "MANAGER";
  const canDashboard = role === "MANAGER";
  const canCreateOrder = role === "COLLECTOR" || role === "MANAGER";

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h1 className="text-2xl font-bold">Home</h1>
      <p className="text-gray-600 mt-1">
        Welcome back, {user?.name}. Choose what you want to do.
      </p>

      <div className="flex flex-wrap gap-3 mt-4">
        {canDashboard && (
          <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
        )}

        <Link to="/orders" className="btn-secondary">View Orders</Link>

        {canCreateOrder && (
          <Link to="/orders/new" className="btn-primary">Create Order</Link>
        )}

        {canPayments && (
          <Link to="/payments" className="btn-secondary">Payments</Link>
        )}

        {canReports && (
          <Link to="/reports" className="btn-secondary">Reports</Link>
        )}
      </div>
    </div>
  );
}
