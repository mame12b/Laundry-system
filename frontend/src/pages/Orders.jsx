import { useEffect, useMemo, useState } from "react";
import { API, authHeader } from "../api.js";
import OrderCard from "../components/OrderCard";
import Toast from "../components/Toast";

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

    // Must match schema statuses: PICKED, RECEIVED, WASHING, IRONING, READY, DELIVERED
    if (role === "WASHER") return orders.filter((o) => o.status === "RECEIVED");
    if (role === "IRONER") return orders.filter((o) => o.status === "WASHING");
    if (role === "DRIVER") return orders.filter((o) => o.status === "READY");

    return orders;
  }, [orders, role]);

  return (
    <div className="space-y-3">
      {/* ✅ Toast must be INSIDE return */}
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: "", message: "" })}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Orders</h2>
        <button className="btn-secondary" onClick={loadOrders}>
          Refresh
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Loading orders...</p>
        </div>
      )}

      {!loading && error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && !error && visibleOrders.length === 0 && (
        <p className="text-sm text-gray-500">No orders available</p>
      )}

      {!loading &&
        !error &&
        visibleOrders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            user={user}
            onUpdated={loadOrders}
            onToast={showToast}   // ✅ give OrderCard access to toast
          />
        ))}
    </div>
  );
}
