import { useEffect, useMemo, useState } from "react";
import { API, authHeader } from "../api";
import Toast from "../components/Toast";
import {
  FiRefreshCw, FiCalendar, FiPackage, FiCheckCircle,
  FiTrendingUp, FiAlertTriangle, FiDownload,
} from "react-icons/fi";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";

const STATUS_FLOW  = ["PICKED","RECEIVED","WASHING","IRONING","READY","DELIVERED"];
const STATUS_COLORS = {
  PICKED:    "#6366f1",
  RECEIVED:  "#f59e0b",
  WASHING:   "#3b82f6",
  IRONING:   "#8b5cf6",
  READY:     "#10b981",
  DELIVERED: "#6b7280",
};
const STATUS_BADGE = {
  PICKED:    "bg-indigo-100 text-indigo-700",
  RECEIVED:  "bg-amber-100 text-amber-700",
  WASHING:   "bg-blue-100 text-blue-700",
  IRONING:   "bg-purple-100 text-purple-700",
  READY:     "bg-green-100 text-green-700",
  DELIVERED: "bg-gray-100 text-gray-600",
};

export default function Reports() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast]     = useState({ type: "", message: "" });

  // Date range
  const today    = new Date().toISOString().slice(0, 10);
  const thirtyAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(thirtyAgo);
  const [to, setTo]     = useState(today);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const load = async (silent = false) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to)   params.set("to",   to + "T23:59:59");

      const res  = await fetch(`${API}/reports/summary?${params}`, { headers: authHeader() });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || `Failed (${res.status})`);
      setData(json);
    } catch (e) {
      showToast("error", e?.message || "Network error");
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const totals = data?.totals || {};

  const byStatus = useMemo(() => {
    const raw = Array.isArray(data?.byStatus) ? data.byStatus : [];
    const total = raw.reduce((s, r) => s + Number(r.count || 0), 0) || 1;
    return STATUS_FLOW
      .map(s => raw.find(r => r._id === s))
      .filter(Boolean)
      .map(r => ({ status: r._id, count: Number(r.count), pct: Math.round((r.count / total) * 100) }));
  }, [data]);

  const revenueByDay = useMemo(() => {
    return (Array.isArray(data?.revenueByDay) ? data.revenueByDay : []).map(d => ({
      date:   `${d._id.y}-${String(d._id.m).padStart(2,"0")}-${String(d._id.d).padStart(2,"0")}`,
      label:  `${String(d._id.m).padStart(2,"0")}/${String(d._id.d).padStart(2,"0")}`,
      amount: Number(d.amount || 0),
    }));
  }, [data]);

  const revenueTotal = useMemo(() => revenueByDay.reduce((s, d) => s + d.amount, 0), [revenueByDay]);

  const printReport = () => window.print();

  return (
    <div className="space-y-5">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "", message: "" })} />

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Reports</h1>
            <p className="text-blue-100 text-sm mt-1">Revenue & operational analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={printReport}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/20 transition" title="Print">
              <FiDownload size={16} />
            </button>
            <button onClick={() => load(true)} disabled={refreshing}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/20 transition" title="Refresh">
              <FiRefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Date filter */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm">
            <FiCalendar size={14} className="text-blue-200" />
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="bg-transparent text-white placeholder-blue-200 focus:outline-none text-sm w-32" />
            <span className="text-blue-200">→</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="bg-transparent text-white placeholder-blue-200 focus:outline-none text-sm w-32" />
          </div>
          <button onClick={() => load(false)}
            className="px-4 py-2 bg-white text-blue-700 font-semibold text-sm rounded-xl hover:bg-blue-50 transition shadow">
            Apply Filter
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_,i) => (
            <div key={i} className="h-20 bg-white rounded-2xl shadow animate-pulse" />
          ))}
        </div>
      )}

      {!loading && data && (
        <>
          {/* ── KPI Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard title="Total Orders"   value={totals.totalOrders ?? 0}
              sub="All orders in period" icon={<FiPackage size={20}/>} iconBg="bg-blue-50" iconColor="text-blue-600" />
            <KPICard title="Delivered"      value={totals.deliveredOrders ?? 0}
              sub="Successfully completed" icon={<FiCheckCircle size={20}/>} iconBg="bg-green-50" iconColor="text-green-600" />
            <KPICard title="Revenue"        value={`SAR ${money(totals.revenue ?? 0)}`}
              sub="Total collected" icon={<FiTrendingUp size={20}/>} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
            <KPICard title="Outstanding"    value={`SAR ${money(totals.outstanding ?? 0)}`}
              sub="Yet to collect" icon={<FiAlertTriangle size={20}/>} iconBg="bg-red-50" iconColor="text-red-500" danger />
          </div>

          {/* ── Charts ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue area chart */}
            <div className="bg-white rounded-2xl shadow p-5 lg:col-span-2">
              <h2 className="font-semibold text-gray-800">Revenue Trend</h2>
              <p className="text-xs text-gray-400 mb-4">Daily payments collected in selected period</p>
              {revenueByDay.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm text-gray-400">No payment data</div>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueByDay} margin={{ left: -10 }}>
                      <defs>
                        <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={v => [`SAR ${money(v)}`, "Revenue"]}
                        contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }} />
                      <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3}
                        fill="url(#rptGrad)" dot={false} activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Status bar chart */}
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="font-semibold text-gray-800">By Status</h2>
              <p className="text-xs text-gray-400 mb-4">Current order distribution</p>
              {byStatus.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm text-gray-400">No data</div>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byStatus} layout="vertical" margin={{ left: 0, right: 10 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="status" tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={false} tickLine={false} width={68} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }} />
                      <Bar dataKey="count" radius={[0,6,6,0]}>
                        {byStatus.map(e => <Cell key={e.status} fill={STATUS_COLORS[e.status] || "#6366f1"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* ── Tables Row ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Order Status Breakdown Table */}
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">Order Status Breakdown</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Count & share per pipeline stage</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 font-medium px-3 py-1 rounded-full">
                  {byStatus.reduce((s,r) => s + r.count, 0)} total
                </span>
              </div>

              {byStatus.length === 0 ? (
                <p className="p-5 text-sm text-gray-400 text-center">No order data</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-right px-5 py-3">Orders</th>
                      <th className="text-right px-5 py-3">Share</th>
                      <th className="px-5 py-3 w-28"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {byStatus.map(r => (
                      <tr key={r.status} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[r.status] || "bg-gray-100 text-gray-600"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-gray-900">{r.count}</td>
                        <td className="px-5 py-3 text-right text-gray-500 text-xs">{r.pct}%</td>
                        <td className="px-5 py-3">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-24 ml-auto">
                            <div className="h-2 rounded-full"
                              style={{ width: `${r.pct}%`, background: STATUS_COLORS[r.status] || "#6366f1" }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Revenue by Day Table */}
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">Revenue by Day</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Daily payment collections</p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1 rounded-full">
                  SAR {money(revenueTotal)}
                </span>
              </div>

              {revenueByDay.length === 0 ? (
                <p className="p-5 text-sm text-gray-400 text-center">No payments recorded</p>
              ) : (
                <div className="overflow-auto max-h-72">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-400 text-xs uppercase sticky top-0">
                      <tr>
                        <th className="text-left px-5 py-3">#</th>
                        <th className="text-left px-5 py-3">Date</th>
                        <th className="text-right px-5 py-3">Amount (SAR)</th>
                        <th className="px-5 py-3 w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {revenueByDay.map((d, i) => {
                        const max = Math.max(...revenueByDay.map(x => x.amount), 1);
                        const pct = Math.round((d.amount / max) * 100);
                        return (
                          <tr key={d.date} className="hover:bg-gray-50 transition">
                            <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                            <td className="px-5 py-3 font-medium text-gray-700">{d.date}</td>
                            <td className="px-5 py-3 text-right font-bold text-gray-900">{money(d.amount)}</td>
                            <td className="px-5 py-3">
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-20 ml-auto">
                                <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td colSpan={2} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total</td>
                        <td className="px-5 py-3 text-right font-bold text-indigo-600">{money(revenueTotal)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Delivery Rate Summary ──────────────────────────── */}
          {totals.totalOrders > 0 && (
            <div className="bg-white rounded-2xl shadow p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Performance Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricRow
                  label="Delivery Rate"
                  value={`${Math.round(((totals.deliveredOrders || 0) / totals.totalOrders) * 100)}%`}
                  sub={`${totals.deliveredOrders} of ${totals.totalOrders} orders`}
                  pct={Math.round(((totals.deliveredOrders || 0) / totals.totalOrders) * 100)}
                  color="bg-green-500"
                />
                <MetricRow
                  label="Collection Rate"
                  value={`${totals.revenue + totals.outstanding > 0
                    ? Math.round((totals.revenue / (totals.revenue + totals.outstanding)) * 100)
                    : 0}%`}
                  sub={`SAR ${money(totals.revenue)} collected`}
                  pct={totals.revenue + totals.outstanding > 0
                    ? Math.round((totals.revenue / (totals.revenue + totals.outstanding)) * 100)
                    : 0}
                  color="bg-indigo-500"
                />
                <MetricRow
                  label="Avg. Order Value"
                  value={`SAR ${totals.totalOrders > 0 ? money((totals.revenue + totals.outstanding) / totals.totalOrders) : "0.00"}`}
                  sub="Revenue ÷ total orders"
                  pct={null}
                  color="bg-blue-500"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function KPICard({ title, value, sub, icon, iconBg, iconColor, danger }) {
  return (
    <div className={`bg-white rounded-2xl shadow p-4 sm:p-5 border ${danger ? "border-red-100" : "border-transparent"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <p className={`text-xl sm:text-2xl font-bold mt-1 truncate ${danger ? "text-red-600" : "text-gray-900"}`}>{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, sub, pct, color }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
      </div>
      {pct !== null && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

function money(n) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
