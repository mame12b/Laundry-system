import { useEffect, useState } from "react";
import { API, authHeader } from "../api";
import Toast from "./Toast";

export default function PaymentHistory({ orderId }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: "", message: "" });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/payments/${orderId}/history`, {
        headers: { ...authHeader() },
      });

      const data = await res.json();
      if (!res.ok) {
        showToast("error", data?.message || "Failed to load payments");
        setPayments([]);
        return;
      }
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      showToast("error", "Network error");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) load();
  }, [orderId]);

  return (
    <div className="bg-white rounded-xl shadow p-4 mt-4">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "", message: "" })} />

      <h3 className="font-semibold mb-3">Payment History</h3>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      {!loading && payments.length === 0 && (
        <p className="text-sm text-gray-500">No payments recorded yet.</p>
      )}

      <div className="space-y-2">
        {payments.map((p) => (
          <div key={p._id} className="border rounded-lg p-3 flex justify-between">
            <div>
              <p className="text-sm font-semibold">{p.amount}</p>
              <p className="text-xs text-gray-500">
                Received by: {p.receivedBy?.name || "—"} ({p.receivedBy?.role || ""})
              </p>
            </div>
            <div className="text-xs text-gray-400">
              {new Date(p.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
