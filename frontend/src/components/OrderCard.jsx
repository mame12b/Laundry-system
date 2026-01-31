import { useState } from "react";
import { API, authHeader } from "../api";
import { canUpdateOrderStatus, normalizeRole } from "../utils/permissions";

export default function OrderCard({ order, user, onUpdated, onToast }) {
  const [updating, setUpdating] = useState(false);

  const role = normalizeRole(user?.role);

  const nextStatusMap = {
    PICKED: "RECEIVED",
    RECEIVED: "WASHING",
    WASHING: "IRONING",
    IRONING: "READY",
    READY: "DELIVERED",
  };

  const nextStatus = nextStatusMap[order.status];
  const canUpdate = canUpdateOrderStatus(role, order.status);

  const outstanding = Math.max(
    Number(order.totalAmount || 0) - Number(order.paidAmount || 0),
    0
  );

  const updateStatus = async () => {
    if (!nextStatus || !canUpdate || updating) return;

    try {
      setUpdating(true);

      const res = await fetch(`${API}/orders/${order._id}/status`, {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update status");
      }

      onToast?.("success", `Order moved to ${nextStatus}`);
      onUpdated?.();
    } catch (e) {
      onToast?.("error", e.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white p-3 rounded shadow mb-2 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold">
            Customer: {order.customer?.name}
          </p>
          <p className="text-xs text-gray-500">Status: {order.status}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="text-sm flex gap-3 mt-2">
        <span>Total: {order.totalAmount}</span>
        <span>Paid: {order.paidAmount}</span>
        <span className={outstanding > 0 ? "text-red-600" : "text-green-700"}>
          Due: {outstanding}
        </span>
      </div>

      {nextStatus && canUpdate && (
        <button
          onClick={updateStatus}
          disabled={updating}
          className={`mt-3 px-3 py-1 rounded text-white ${
            updating
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {updating ? "Updating..." : `Mark as ${nextStatus}`}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PICKED: "bg-gray-100 text-gray-800",
    RECEIVED: "bg-orange-100 text-orange-800",
    WASHING: "bg-yellow-100 text-yellow-800",
    IRONING: "bg-purple-100 text-purple-800",
    READY: "bg-blue-100 text-blue-800",
    DELIVERED: "bg-green-100 text-green-800",
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${consider(map[status])}`}>
      {status}
    </span>
  );
}

function consider(cls) {
  return cls || "bg-gray-100 text-gray-800";
}
