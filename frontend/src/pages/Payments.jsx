import { useEffect, useMemo, useState } from "react";
import { API, authHeader } from "../api.js";
import Toast from "../components/Toast";

// ✅ Change this if your route is different:
const PAY_ENDPOINT = (id) => `${API}/payments/${id}`; // <-- update to match your backend route

export default function Payments({ user }) {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({ type: "", message: "" });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);

      const res = await fetch(`${API}/orders`, {
        headers: { ...authHeader() },
      });

      const data = await res.json();
      if (!res.ok) {
        showToast("error", data?.message || "Failed to load orders");
        setOrders([]);
        return;
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast("error", "Network error while loading orders");
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dueOrders = useMemo(() => {
    return orders
      .map((o) => {
        const total = Number(o.totalAmount || 0);
        const paid = Number(o.paidAmount || 0);
        const due = Math.max(total - paid, 0);
        return { ...o, due };
      })
      .filter((o) => o.due > 0)
      .sort((a, b) => b.createdAt?.localeCompare(a.createdAt) || 0);
  }, [orders]);

  const selectedOrder = useMemo(() => {
    return dueOrders.find((o) => o._id === selectedId) || null;
  }, [dueOrders, selectedId]);

  const maxDue = selectedOrder ? Number(selectedOrder.due || 0) : 0;

const submitPayment = async (e) => {
  e.preventDefault();

  try {
    setSubmitting(true);

    const res = await fetch(PAY_ENDPOINT(selectedOrder._id), {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount) }),
    });

    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      // ✅ show backend error message if exists
      const msg = data?.error || data?.message || `Request failed (${res.status})`;
      showToast("error", msg);
      return;
    }

    showToast("success", "Payment recorded successfully");
    setAmount("");
    setSelectedId("");
    await loadOrders();
  } catch (e) {
    showToast("error", e?.message || "Network error");
  } finally {
    setSubmitting(false);
  }
};


  return (
    <div className="space-y-4">
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: "", message: "" })}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments</h1>
        <button className="btn-secondary" onClick={loadOrders}>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Outstanding Orders</h2>
            <span className="text-sm text-gray-500">
              {dueOrders.length} order(s)
            </span>
          </div>

          {loadingOrders && (
            <p className="text-sm text-gray-600">Loading orders...</p>
          )}

          {!loadingOrders && dueOrders.length === 0 && (
            <p className="text-sm text-gray-500">No outstanding payments 🎉</p>
          )}

          <div className="space-y-2">
            {dueOrders.map((o) => (
              <button
                key={o._id}
                onClick={() => {
                  setSelectedId(o._id);
                  setAmount(String(o.due)); // auto-fill full due (nice UX)
                }}
                className={`w-full text-left border rounded-lg p-3 hover:bg-gray-50 transition ${
                  selectedId === o._id ? "border-blue-600 bg-blue-50" : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">
                      {o.customer?.name || "Unknown Customer"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {o.status} • Order: {o._id.slice(-6)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">
                      Due: {o.due}
                    </p>
                    <p className="text-xs text-gray-500">
                      Total: {o.totalAmount} • Paid: {o.paidAmount}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Record Payment</h2>

          {!selectedOrder ? (
            <p className="text-sm text-gray-500">
              Select an order from the list to record a payment.
            </p>
          ) : (
            <div className="mb-3 text-sm">
              <p className="font-semibold">{selectedOrder.customer?.name}</p>
              <p className="text-gray-500 text-xs">
                Total: {selectedOrder.totalAmount} • Paid: {selectedOrder.paidAmount}
              </p>
              <p className="text-red-600 font-semibold mt-1">Due: {maxDue}</p>
            </div>
          )}

          <form onSubmit={submitPayment} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedOrder && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setAmount(String(maxDue))}
                  >
                    Pay Full
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setAmount("")}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedOrder || submitting}
              className={`w-full py-2 rounded-lg text-white font-semibold transition ${
                !selectedOrder || submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {submitting ? "Saving..." : "Save Payment"}
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-3">
            Tip: select an order to auto-fill the due amount.
          </p>
        </div>
      </div>
    </div>
  );
}
