import { useEffect, useMemo, useState } from "react";
import { API, apiFetch } from "../api";

export default function OrderCard({ order, user, onUpdated, onToast }) {
  const [updating, setUpdating] = useState(false);
  const [staff, setStaff] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const role = (user?.role || "").toUpperCase();
  const isManager = role === "MANAGER";

  useEffect(() => {
    if (!isManager) return;

    (async () => {
      try {
        const res = await apiFetch(`${API}/users/staff`);
        const data = await res.json();
        if (res.ok) setStaff(Array.isArray(data) ? data : []);
      } catch {}
    })();
  }, [isManager]);

  const assign = async (userId) => {
    if (!userId) return;
    try {
      setAssigning(true);

      const res = await apiFetch(`${API}/orders/${order._id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const text = await res.text();
      const data = safeJson(text);

      if (!res.ok) {
        throw new Error(data?.message || "Assign failed");
      }

      onToast?.("success", "Order assigned");
      await onUpdated?.();
    } catch (e) {
      onToast?.("error", e.message || "Assign failed");
    } finally {
      setAssigning(false);
    }
  };

  // status flow
  const nextStatusMap = {
    PICKED: "RECEIVED",
    RECEIVED: "WASHING",
    WASHING: "IRONING",
    IRONING: "READY",
    READY: "DELIVERED",
  };
  const nextStatus = nextStatusMap[order.status];

  const roleAllowedNext = {
    COLLECTOR: "RECEIVED",
    WASHER: "WASHING",
    SORTER: "IRONING",
    IRONER: "READY",
    DRIVER: "DELIVERED",
    MANAGER: "*",
  };

  const canUpdate = useMemo(() => {
    if (!nextStatus || !role) return false;
    if (role === "MANAGER") return true;
    return roleAllowedNext[role] === nextStatus;
  }, [role, nextStatus]);

  const updateStatus = async () => {
    if (!nextStatus || updating) return;

    try {
      setUpdating(true);
      const res = await apiFetch(`${API}/orders/${order._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const text = await res.text();
      const data = safeJson(text);

      if (!res.ok) throw new Error(data?.message || "Failed to update status");

      onToast?.("success", `Order updated to ${nextStatus}`);
      await onUpdated?.();
    } catch (e) {
      onToast?.("error", e.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const outstanding = Math.max(
    Number(order.totalAmount || 0) - Number(order.paidAmount || 0),
    0
  );

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            Customer: {order.customer?.name || "—"}
          </p>
          <p className="text-xs text-gray-500">
            Status: {order.status} • #{order._id?.slice(-6)}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Assigned:{" "}
            <b>
              {order.assignedTo?.name
                ? `${order.assignedTo.name} (${order.assignedTo.role})`
                : "Not assigned"}
            </b>
          </p>
        </div>

        <StatusBadge status={order.status} />
      </div>

      <div className="text-sm flex flex-wrap gap-3 mt-3">
        <span>Total: {order.totalAmount}</span>
        <span>Paid: {order.paidAmount}</span>
        <span className={outstanding > 0 ? "text-red-600" : "text-green-700"}>
          Due: {outstanding}
        </span>
      </div>

      {/* ✅ Manager assignment */}
      {isManager && (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <select
            className="w-full sm:w-auto border rounded-lg px-3 py-2 text-sm"
            defaultValue=""
            onChange={(e) => assign(e.target.value)}
            disabled={assigning}
          >
            <option value="" disabled>
              {assigning ? "Assigning..." : "Assign to staff..."}
            </option>
            {staff.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} — {u.role}
              </option>
            ))}
          </select>

          <span className="text-xs text-gray-400 self-center">
            Tip: order will appear in that staff queue.
          </span>
        </div>
      )}

      {/* ✅ Status update button */}
      {canUpdate && (
        <button
          className={`mt-3 w-full sm:w-auto px-4 py-2 rounded-lg text-white font-semibold ${
            updating ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
          onClick={updateStatus}
          disabled={updating}
        >
          {updating ? "Updating..." : `Mark as ${nextStatus}`}
        </button>
      )}

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

function safeJson(text) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text };
  }
}
