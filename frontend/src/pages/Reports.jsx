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
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = { message: text };
      }

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
    <div className="space-y-4 sm:space-y-6">
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: "", message: "" })}
      />

      {/* Header (responsive) */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Reports</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Revenue and operational overview
            </p>
          </div>

          <button
            onClick={load}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold text-white bg-green-600 hover:bg-green-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <p className="text-gray-600 text-sm">Loading reports...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary cards (mobile: 2 cols, tablet+: 4 cols) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Stat title="Total Orders" value={totals.totalOrders ?? 0} />
            <Stat title="Delivered" value={totals.deliveredOrders ?? 0} />
            <Stat title="Revenue" value={formatMoney(totals.revenue ?? 0)} />
            <Stat
              title="Outstanding"
              value={formatMoney(totals.outstanding ?? 0)}
              highlight="danger"
            />
          </div>

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {/* Orders by status */}
            <div className="bg-white rounded-xl shadow p-4 sm:p-6">
              <h2 className="font-semibold mb-3 sm:mb-4">Orders by Status</h2>

              {byStatus.length === 0 ? (
                <p className="text-sm text-gray-500">No data</p>
              ) : (
                <div className="space-y-2">
                  {byStatus.map((s) => (
                    <div
                      key={s._id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <span className="text-sm font-medium">{s._id}</span>
                      <span className="text-sm text-gray-700 font-semibold">
                        {s.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revenue by day */}
            <div className="bg-white rounded-xl shadow p-4 sm:p-6">
              <h2 className="font-semibold mb-3 sm:mb-4">Revenue by Day</h2>

              {revenueByDay.length === 0 ? (
                <p className="text-sm text-gray-500">No payments recorded</p>
              ) : (
                <div className="space-y-3">
                  {revenueByDay.map((d) => {
                    const label = `${d._id.y}-${String(d._id.m).padStart(2, "0")}-${String(d._id.d).padStart(2, "0")}`;
                    const pct = Math.round(((d.amount || 0) / maxRevenueDay) * 100);

                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
                          <span className="truncate">{label}</span>
                          <span className="shrink-0 font-semibold text-gray-700">
                            {formatMoney(d.amount || 0)}
                          </span>
                        </div>

                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-2.5 bg-blue-600 rounded-full"
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
    <div className={`rounded-xl shadow border ${cls} p-3 sm:p-5`}>
      <p className="text-gray-500 text-xs sm:text-sm">{title}</p>
      <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2">{value}</p>
    </div>
  );
}

function formatMoney(n) {
  const num = Number(n || 0);
  return num.toLocaleString(undefined, { minimumFractionDigits: 0 });
}
