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

  // Which role is allowed to do which NEXT status (same as backend)
  const roleAllowedNext = {
    COLLECTOR: "RECEIVED",
    WASHER: "WASHING",
    IRONER: "IRONING",
    DRIVER: "DELIVERED",
    MANAGER: "*",
  };

  const role = (user?.role || "").toUpperCase();

  const canUpdate = useMemo(() => {
    if (!nextStatus) return false;
    if (!role) return false;
    if (role === "MANAGER") return true;

    const allowed = roleAllowedNext[role];
    return allowed === nextStatus;
  }, [role, nextStatus]);

  const total = Number(order.totalAmount || 0);
  const paid = Number(order.paidAmount || 0);
  const due = Math.max(total - paid, 0);

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
    <div className="bg-white rounded-xl shadow p-4 sm:p-5 transition hover:shadow-md">
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm sm:text-base font-semibold truncate">
            Customer: {order.customer?.name || "—"}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Status: <span className="font-medium text-gray-700">{order.status}</span>
          </p>
          {order._id && (
            <p className="text-[11px] sm:text-xs text-gray-400 truncate">
              Order: {order._id}
            </p>
          )}
        </div>

        <StatusBadge status={order.status} />
      </div>

      {/* Totals */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs sm:text-sm">
        <Stat label="Total" value={total} />
        <Stat label="Paid" value={paid} />
        <Stat
          label="Due"
          value={due}
          valueClass={due > 0 ? "text-red-600" : "text-green-700"}
        />
      </div>

      {/* Actions */}
      {canUpdate && (
        <button
          onClick={updateStatus}
          disabled={updating}
          className={`mt-4 w-full sm:w-auto sm:inline-flex sm:px-4 sm:py-2 px-4 py-2 rounded-lg font-semibold text-white transition
            ${
              updating
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
        >
          {updating ? "Updating..." : `Mark as ${nextStatus}`}
        </button>
      )}

      {!canUpdate && nextStatus && role && role !== "MANAGER" && (
        <p className="mt-3 text-xs text-gray-400">
          Next step: <span className="font-semibold">{nextStatus}</span> (only allowed role can update)
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, valueClass = "" }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
      <p className="text-[11px] sm:text-xs text-gray-500">{label}</p>
      <p className={`text-sm sm:text-base font-semibold ${valueClass}`}>{value}</p>
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
      : s === "PICKED"
      ? "bg-slate-100 text-slate-800"
      : "bg-gray-100 text-gray-800";

  return (
    <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${cls}`}>
      {s}
    </span>
  );
}
