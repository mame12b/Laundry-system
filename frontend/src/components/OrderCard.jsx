import { useMemo, useState } from "react";
import { API, authHeader } from "../api";

export default function OrderCard({ order, user, onUpdated, onToast }) {
  const [updating, setUpdating] = useState(false);

  // status flow (must match backend enum)
  const nextStatusMap = {
    PICKED: "RECEIVED",
    RECEIVED: "WASHING",
    WASHING: "IRONING",
    IRONING: "READY",
    READY: "DELIVERED",
  };

  const nextStatus = nextStatusMap[order.status];

  // ✅ Which role is allowed to do which NEXT status (same as backend)
  const roleAllowedNext = {
    COLLECTOR: "RECEIVED",
    WASHER: "WASHING",
    IRONER: "IRONING",
    DRIVER: "DELIVERED",
    MANAGER: "*", // can do all valid next transitions
  };

  const role = (user?.role || "").toUpperCase();

  const canUpdate = useMemo(() => {
    if (!nextStatus) return false;
    if (!role) return false;

    if (role === "MANAGER") return true;

    const allowed = roleAllowedNext[role];
    return allowed === nextStatus;
  }, [role, nextStatus]);

  const outstanding = Math.max(
    Number(order.totalAmount || 0) - Number(order.paidAmount || 0),
    0
  );

  const updateStatus = async () => {
    if (!nextStatus || updating) return;

    try {
      setUpdating(true);

      const res = await fetch(`${API}/orders/${order._id}/status`, {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        let msg = "Failed to update status";
        try {
          const err = await res.json();
          msg = err.message || msg;
        } catch {
          const txt = await res.text();
          if (txt) msg = txt;
        }
        throw new Error(msg);
      }

      onToast?.("success", `Order updated to ${nextStatus}`);
      await onUpdated?.();
    } catch (e) {
      onToast?.("error", e.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white p-3 rounded shadow mb-2 transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            Customer: {order.customer?.name || "—"}
          </p>
          <p className="text-xs text-gray-500">Status: {order.status}</p>
        </div>

        <StatusBadge status={order.status} />
      </div>

      <div className="text-sm flex flex-wrap gap-3 mt-2">
        <span>Total: {order.totalAmount}</span>
        <span>Paid: {order.paidAmount}</span>
        <span className={outstanding > 0 ? "text-red-600" : "text-green-700"}>
          Due: {outstanding}
        </span>
      </div>

      {/* ✅ Button only shows if user is allowed */}
      {canUpdate && (
        <button
          className={`mt-3 px-3 py-1 rounded text-white ${
            updating
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          }`}
          onClick={updateStatus}
          disabled={updating}
        >
          {updating ? "Updating..." : `Mark as ${nextStatus}`}
        </button>
      )}

      {/* Optional: show why user can’t update (nice UX) */}
      {!canUpdate && nextStatus && role && role !== "MANAGER" && (
        <p className="mt-3 text-xs text-gray-400">
          Next step: <b>{nextStatus}</b> (only allowed role can update)
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || "").toUpperCase();

  const cls =
    s === "DELIVERED"
      ? "bg-green-100 text-green-800"
      : s === "READY"
      ? "bg-blue-100 text-blue-800"
      : s === "IRONING"
      ? "bg-purple-100 text-purple-800"
      : s === "WASHING"
      ? "bg-yellow-100 text-yellow-800"
      : s === "RECEIVED"
      ? "bg-orange-100 text-orange-800"
      : "bg-gray-100 text-gray-800";

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${cls}`}>
      {s}
    </span>
  );
}
