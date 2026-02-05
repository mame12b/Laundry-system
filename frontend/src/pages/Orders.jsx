import { useEffect, useMemo, useState } from "react";
import { API, authHeader } from "../api.js";
import OrderCard from "../components/OrderCard";
import Toast from "../components/Toast";
import { Link } from "react-router-dom";

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({ type: "", message: "" });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/orders`, {
        method: "GET",
        headers: { ...authHeader() },
      });

      if (!res.ok) {
        let msg = "Failed to load orders";
        try {
          const err = await res.json();
          msg = err.message || msg;
        } catch {}
        setError(msg);
        setOrders([]);
        return;
      }

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Network error");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const role = (user?.role || "").toUpperCase();

  const visibleOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    if (!role) return orders;

    if (role === "WASHER") return orders.filter((o) => o.status === "RECEIVED");
    if (role === "IRONER") return orders.filter((o) => o.status === "WASHING");
    if (role === "DRIVER") return orders.filter((o) => o.status === "READY");

    return orders;
  }, [orders, role]);

  const canCreate = role === "COLLECTOR" || role === "MANAGER";

  return (
    <div className="space-y-4">
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: "", message: "" })}
      />

      {/* Header */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Orders</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Showing {visibleOrders.length} order(s)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {canCreate && (
              <Link
                to="/orders/new"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                + Create Order
              </Link>
            )}

            <button
              onClick={loadOrders}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold text-white bg-green-600 hover:bg-green-700 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-600 text-sm">Loading orders...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && visibleOrders.length === 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">No orders available</p>
        </div>
      )}

      {/* List */}
      {!loading && !error && visibleOrders.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              user={user}
              onUpdated={loadOrders}
              onToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}
