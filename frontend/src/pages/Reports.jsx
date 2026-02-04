import { useEffect, useMemo, useState } from "react";
import { API, authHeader } from "../api";
import Toast from "../components/Toast";

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: "", message: "" });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const load = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/reports/summary`, {
        headers: { ...authHeader() },
      });

      const text = await res.text();
      let json = {};
      try { json = text ? JSON.parse(text) : {}; } catch { json = { message: text }; }

      if (!res.ok) {
        showToast("error", json?.error || json?.message || `Failed (${res.status})`);
        setData(null);
        return;
      }

      setData(json);
    } catch (e) {
      showToast("error", e?.message || "Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = data?.totals || {};
  const byStatus = data?.byStatus || [];
  const revenueByDay = data?.revenueByDay || [];

  const maxRevenueDay = useMemo(() => {
    const values = revenueByDay.map((d) => d.amount || 0);
    return Math.max(...values, 1);
  }, [revenueByDay]);

  return (
    <div className="space-y-6">
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: "", message: "" })}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-gray-500">Revenue and operational overview</p>
        </div>
        <button className="btn-secondary" onClick={load}>
          Refresh
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 text-sm">Loading reports...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Stat title="Total Orders" value={totals.totalOrders ?? 0} />
            <Stat title="Delivered" value={totals.deliveredOrders ?? 0} />
            <Stat title="Revenue" value={formatMoney(totals.revenue ?? 0)} />
            <Stat title="Outstanding" value={formatMoney(totals.outstanding ?? 0)} highlight="danger" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders by status */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold mb-4">Orders by Status</h2>
              {byStatus.length === 0 ? (
                <p className="text-sm text-gray-500">No data</p>
              ) : (
                <div className="space-y-3">
                  {byStatus.map((s) => (
                    <div key={s._id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{s._id}</span>
                      <span className="text-sm text-gray-600">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revenue last days */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold mb-4">Revenue by Day</h2>
              {revenueByDay.length === 0 ? (
                <p className="text-sm text-gray-500">No payments recorded</p>
              ) : (
                <div className="space-y-3">
                  {revenueByDay.map((d) => {
                    const label = `${d._id.y}-${String(d._id.m).padStart(2, "0")}-${String(d._id.d).padStart(2, "0")}`;
                    const pct = Math.round(((d.amount || 0) / maxRevenueDay) * 100);
                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{label}</span>
                          <span>{formatMoney(d.amount || 0)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded">
                          <div
                            className="h-2 bg-blue-500 rounded"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ title, value, highlight }) {
  const cls =
    highlight === "danger"
      ? "border-red-200 bg-red-50"
      : "border-gray-200 bg-white";

  return (
    <div className={`rounded-xl shadow p-6 border ${cls}`}>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

function formatMoney(n) {
  const num = Number(n || 0);
  return num.toLocaleString(undefined, { minimumFractionDigits: 0 });
}
