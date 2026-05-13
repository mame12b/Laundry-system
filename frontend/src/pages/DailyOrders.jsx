import { useEffect, useMemo, useState } from "react";
import { API, apiFetch } from "../api";
import Toast from "../components/Toast";
import { FiRefreshCw, FiCalendar } from "react-icons/fi";
import { useLanguage } from "../context/LanguageContext";

const STATUS_FLOW = ["PICKED", "RECEIVED", "WASHING", "IRONING", "READY", "DELIVERED"];

const STATUS_META = {
  PICKED:    { bg: "bg-indigo-100", text: "text-indigo-700", dot: "#6366f1" },
  RECEIVED:  { bg: "bg-amber-100",  text: "text-amber-700",  dot: "#f59e0b" },
  WASHING:   { bg: "bg-blue-100",   text: "text-blue-700",   dot: "#3b82f6" },
  IRONING:   { bg: "bg-purple-100", text: "text-purple-700", dot: "#8b5cf6" },
  READY:     { bg: "bg-green-100",  text: "text-green-700",  dot: "#10b981" },
  DELIVERED: { bg: "bg-gray-100",   text: "text-gray-600",   dot: "#6b7280" },
};

function money(n) {
  return Number(n || 0).toFixed(2);
}

function itemSummary(items = []) {
  if (!items.length) return "—";
  const parts = items.slice(0, 2).map(i => {
    const name = typeof i.item === "object" ? i.item?.name : i.item;
    return `${name || "?"} ×${i.qty}`;
  });
  const more = items.length > 2 ? ` +${items.length - 2}` : "";
  return parts.join(", ") + more;
}

function StageProgress({ status }) {
  const idx = STATUS_FLOW.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {STATUS_FLOW.map((s, i) => (
        <div
          key={s}
          title={s}
          className="w-2.5 h-2.5 rounded-full transition-all"
          style={{ background: i <= idx ? STATUS_META[s]?.dot : "#e5e7eb" }}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status, t }) {
  const m = STATUS_META[status] || { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.bg} ${m.text}`}>
      {t(`status_${status}`) || status}
    </span>
  );
}

export default function DailyOrders() {
  const { t } = useLanguage();

  const today     = new Date().toISOString().slice(0, 10);
  const sevenAgo  = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast]         = useState({ type: "", message: "" });
  const [from, setFrom]           = useState(sevenAgo);
  const [to, setTo]               = useState(today);
  const [statusFilter, setStatusFilter] = useState("");

  const showToast = (type, msg) => {
    setToast({ type, message: msg });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const load = async (silent = false) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      const res  = await apiFetch(`${API}/orders`);
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.message || "Failed to load orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast("error", e.message || "Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  // Filter by date range + status
  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (!o.createdAt) return false;
      const d = o.createdAt.slice(0, 10);
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      if (statusFilter && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, from, to, statusFilter]);

  // Group by day, most recent first
  const byDay = useMemo(() => {
    const map = new Map();
    filtered.forEach(o => {
      const day = o.createdAt.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(o);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // Grand totals
  const grandTotal = useMemo(() => ({
    count:   filtered.length,
    revenue: filtered.reduce((s, o) => s + Number(o.paidAmount || 0), 0),
    outstanding: filtered.reduce((s, o) => s + Math.max(Number(o.totalAmount || 0) - Number(o.paidAmount || 0), 0), 0),
  }), [filtered]);

  return (
    <div className="space-y-5">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "", message: "" })} />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t("daily_orders")}</h1>
            <p className="text-blue-100 text-sm mt-1">{t("daily_orders_sub")}</p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="self-start p-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/20 transition"
          >
            <FiRefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm">
            <FiCalendar size={14} className="text-blue-200 flex-shrink-0" />
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-sm w-32" />
            <span className="text-blue-200">→</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-sm w-32" />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/10 border border-white/20 text-white text-sm rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="" className="text-gray-900">{t("daily_all_stages")}</option>
            {STATUS_FLOW.map(s => (
              <option key={s} value={s} className="text-gray-900">{t(`status_${s}`)}</option>
            ))}
          </select>
        </div>

        {/* Summary pills */}
        {!loading && (
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="bg-white/15 rounded-xl px-4 py-2 text-sm">
              <span className="text-blue-200">{t("orders_title")}: </span>
              <span className="font-bold">{grandTotal.count}</span>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-2 text-sm">
              <span className="text-blue-200">{t("daily_revenue")}: </span>
              <span className="font-bold">{money(grandTotal.revenue)}</span>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-2 text-sm">
              <span className="text-blue-200">{t("daily_outstanding")}: </span>
              <span className={`font-bold ${grandTotal.outstanding > 0 ? "text-red-300" : ""}`}>
                {money(grandTotal.outstanding)}
              </span>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-2xl shadow animate-pulse" />
          ))}
        </div>
      )}

      {!loading && byDay.length === 0 && (
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <p className="text-gray-400 text-sm">{t("daily_none")}</p>
        </div>
      )}

      {/* Day groups */}
      {!loading && byDay.map(([day, dayOrders]) => {
        const dayRevenue     = dayOrders.reduce((s, o) => s + Number(o.paidAmount || 0), 0);
        const dayOutstanding = dayOrders.reduce((s, o) => s + Math.max(Number(o.totalAmount || 0) - Number(o.paidAmount || 0), 0), 0);

        // Stage count for this day
        const stageCounts = {};
        dayOrders.forEach(o => { stageCounts[o.status] = (stageCounts[o.status] || 0) + 1; });

        const dateLabel = new Date(day + "T12:00:00").toLocaleDateString(undefined, {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        });

        return (
          <div key={day} className="bg-white rounded-2xl shadow overflow-hidden">
            {/* Day header */}
            <div className="bg-gray-50 border-b px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-bold text-gray-800 text-sm sm:text-base">{dateLabel}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {STATUS_FLOW.map(s => stageCounts[s] ? (
                    <span key={s} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_META[s].bg} ${STATUS_META[s].text}`}>
                      {t(`status_${s}`)}: {stageCounts[s]}
                    </span>
                  ) : null)}
                </div>
              </div>
              <div className="flex gap-4 text-xs text-gray-500 flex-shrink-0">
                <span>
                  {dayOrders.length} {t("daily_orders_count")}
                </span>
                <span className="text-green-700 font-semibold">
                  {t("card_paid")}: {money(dayRevenue)}
                </span>
                {dayOutstanding > 0 && (
                  <span className="text-red-600 font-semibold">
                    {t("card_due")}: {money(dayOutstanding)}
                  </span>
                )}
              </div>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {dayOrders.map((o, idx) => {
                const due = Math.max(Number(o.totalAmount || 0) - Number(o.paidAmount || 0), 0);
                return (
                  <div key={o._id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{o.customer?.name || "—"}</p>
                        <p className="text-xs text-gray-400">
                          #{o._id.slice(-6)} · {o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                      </div>
                      <StatusBadge status={o.status} t={t} />
                    </div>

                    <div className="flex items-center justify-between">
                      <StageProgress status={o.status} />
                      <span className="text-xs text-gray-400">{idx + 1}</span>
                    </div>

                    <p className="text-xs text-gray-500 truncate">{itemSummary(o.items)}</p>

                    <div className="flex gap-3 text-xs">
                      <span>{t("card_total")}: <b>{money(o.totalAmount)}</b></span>
                      <span className="text-green-700">{t("card_paid")}: <b>{money(o.paidAmount)}</b></span>
                      {due > 0 && <span className="text-red-600 font-bold">{t("card_due")}: {money(due)}</span>}
                    </div>

                    <div className="flex gap-3 text-xs text-gray-400">
                      {o.collectedBy?.name && <span>{t("daily_collector")}: <b className="text-gray-600">{o.collectedBy.name}</b></span>}
                      {o.assignedTo?.name  && <span>{t("daily_worker")}: <b className="text-gray-600">{o.assignedTo.name}</b></span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-400 text-xs uppercase border-b">
                  <tr>
                    <th className="text-left px-4 py-3 w-8">#</th>
                    <th className="text-left px-4 py-3">{t("card_customer")}</th>
                    <th className="text-left px-4 py-3">ID</th>
                    <th className="text-left px-4 py-3">{t("daily_items")}</th>
                    <th className="text-left px-4 py-3">{t("daily_progress")}</th>
                    <th className="text-left px-4 py-3">{t("daily_stage")}</th>
                    <th className="text-right px-4 py-3">{t("card_total")}</th>
                    <th className="text-right px-4 py-3">{t("card_paid")}</th>
                    <th className="text-right px-4 py-3">{t("card_due")}</th>
                    <th className="text-left px-4 py-3">{t("daily_collector")}</th>
                    <th className="text-left px-4 py-3">{t("daily_worker")}</th>
                    <th className="text-left px-4 py-3">{t("daily_time")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dayOrders.map((o, idx) => {
                    const due = Math.max(Number(o.totalAmount || 0) - Number(o.paidAmount || 0), 0);
                    const time = o.createdAt
                      ? new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "—";
                    return (
                      <tr key={o._id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 whitespace-nowrap">{o.customer?.name || "—"}</p>
                          {o.customer?.type && (
                            <p className="text-xs text-gray-400">{o.customer.type}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">#{o._id.slice(-6)}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px]">
                          <span className="block truncate">{itemSummary(o.items)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <StageProgress status={o.status} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={o.status} t={t} />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{money(o.totalAmount)}</td>
                        <td className="px-4 py-3 text-right text-green-700 font-medium">{money(o.paidAmount)}</td>
                        <td className={`px-4 py-3 text-right font-bold ${due > 0 ? "text-red-600" : "text-gray-300"}`}>
                          {due > 0 ? money(due) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {o.collectedBy?.name || <span className="text-gray-300">{t("daily_unassigned")}</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {o.assignedTo?.name
                            ? <><span className="font-medium">{o.assignedTo.name}</span> <span className="text-gray-400">({o.assignedTo.role})</span></>
                            : <span className="text-gray-300">{t("daily_unassigned")}</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{time}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Day totals row */}
                <tfoot className="bg-gray-50 border-t-2 border-gray-200 text-xs font-semibold">
                  <tr>
                    <td colSpan={6} className="px-4 py-2 text-gray-500 uppercase tracking-wide">
                      {t("card_total")} — {dayOrders.length} {t("daily_orders_count")}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-800">
                      {money(dayOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0))}
                    </td>
                    <td className="px-4 py-2 text-right text-green-700">
                      {money(dayRevenue)}
                    </td>
                    <td className={`px-4 py-2 text-right ${dayOutstanding > 0 ? "text-red-600" : "text-gray-300"}`}>
                      {dayOutstanding > 0 ? money(dayOutstanding) : "—"}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
