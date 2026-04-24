import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { API, apiFetch } from "../api.js";
import PaymentHistory from "../components/PaymentHistory.jsx";

export default function OrderDetails({ user }) {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await apiFetch(`${API}/orders/${id}`);

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }

      if (!res.ok) {
        setOrder(null);
        setError(data?.message || `Failed to load order (${res.status})`);
        return;
      }

      setOrder(data);
    } catch (e) {
      setError("Network error while loading order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <p className="text-sm text-gray-600">Loading...</p>;

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <p className="text-red-600 font-semibold">Failed to load order</p>
        <p className="text-sm text-gray-600">{error}</p>
        <button className="btn-secondary" onClick={loadOrder}>
          Retry
        </button>
        <Link className="text-blue-600 underline text-sm" to="/orders">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const total = Number(order.totalAmount || 0);
  const paid = Number(order.paidAmount || 0);
  const due = Math.max(total - paid, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Order #{order._id?.slice(-6)}</h2>
            <p className="text-sm text-gray-600">
              Status: <span className="font-semibold">{order.status}</span>
            </p>
          </div>

          <Link to="/invoices" className="btn-primary">
            View Invoices
          </Link>
        </div>

        <div className="mt-3 text-sm flex flex-wrap gap-4">
          <span>Total: <b>{total}</b></span>
          <span>Paid: <b>{paid}</b></span>
          <span className={due > 0 ? "text-red-600" : "text-green-700"}>
            Due: <b>{due}</b>
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold mb-3">Items</h3>

        <div className="space-y-2">
          {(order.items || []).map((i, idx) => {
            const itemObj = i?.item;
            const name =
              (itemObj && typeof itemObj === "object" ? itemObj.name : itemObj) ||
              `Item ${idx + 1}`;
            const qty = Number(i?.qty || 0);
            const price = Number(i?.price || 0);
            const lineTotal = qty * price;

            return (
              <div key={i._id || idx} className="flex justify-between text-sm border-b pb-2">
                <span className="font-medium">{name}</span>
                <span className="text-gray-600">
                  {qty} × {price} = <b>{lineTotal}</b>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History (Cashier/Manager only) */}
      {["CASHIER", "MANAGER"].includes((user?.role || "").toUpperCase()) && (
        <PaymentHistory orderId={id} />
      )}

      <Link className="text-blue-600 underline text-sm" to="/orders">
        ← Back to Orders
      </Link>
    </div>
  );
}
