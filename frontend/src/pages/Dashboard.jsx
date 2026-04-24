import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API, apiFetch } from "../api.js";
import Toast from "../components/Toast";
import {
  FiPackage, FiDollarSign, FiTrendingUp, FiCheckCircle,
  FiAlertTriangle, FiArrowRight, FiRefreshCw, FiClock,
  FiUsers, FiFileText,
} from "react-icons/fi";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";

const STATUS_FLOW = ["PICKED", "RECEIVED", "WASHING", "IRONING", "READY", "DELIVERED"];

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

export default function Dashboard({ user }) {
  const role = (user?.role || "").toUpperCase();
  const isManager = role === "MANAGER";

  const [report, setReport]       = useState(null);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast]         = useState({ type: "", message: "" });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const load = async (silent = false) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);

      const reqs = [
        apiFetch(`${API}/orders`).then(async r => {
          const j = await r.json().catch(() => []);
          if (!r.ok) throw new Error(j?.message || "Orders failed");
          return Array.isArray(j) ? j : [];
        }),
      ];

      if (isManager) {
        reqs.push(
          apiFetch(`${API}/reports/summary`).then(async r => {
            const j = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(j?.message || "Reports failed");
            return j;
          })
        );
      }

      const results = await Promise.all(reqs);
      setOrders(results[0]);
      setReport(isManager ? results[1] : null);
    } catch (e) {
      showToast("error", e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const staffQueue = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    if (role === "COLLECTOR") return orders.filter(o => o.status === "PICKED");
    if (role === "WASHER")    return orders.filter(o => o.status === "RECEIVED");
    if (role === "SORTER")    return orders.filter(o => o.status === "WASHING");
    if (role === "IRONER")    return orders.filter(o => o.status === "IRONING");
    if (role === "DRIVER")    return orders.filter(o => o.status === "READY");
    if (role === "CASHIER")   return orders.filter(o => Number(o.totalAmount || 0) > Number(o.paidAmount || 0));
    return orders;
  }, [orders, role]);

  const totals     = report?.totals || {};
  const revenueByDay = useMemo(() => {
    return (Array.isArray(report?.revenueByDay) ? report.revenueByDay : []).map(d => ({
      date:   `${String(d._id.m).padStart(2, "0")}/${String(d._id.d).padStart(2, "0")}`,
      amount: Number(d.amount || 0),
    }));
  }, [report]);

  const byStatus = useMemo(() => {
    return (Array.isArray(report?.byStatus) ? report.byStatus : [])
      .map(s => ({ status: s._id, count: Number(s.count || 0) }))
      .sort((a, b) => STATUS_FLOW.indexOf(a.status) - STATUS_FLOW.indexOf(b.status));
  }, [report]);

  const statusCounts = useMemo(() => {
    const m = {};
    orders.forEach(o => { m[o.status] = (m[o.status] || 0) + 1; });
    return m;
  }, [orders]);

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-2xl shadow animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "", message: "" })} />

      {/* ── Gradient Header ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium">{todayStr}</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              Good {getTimeOfDay()}, {user?.name}!
            </h1>
            <p className="text-blue-100 text-sm mt-1">{getRoleDesc(role)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-white/20 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-full border border-white/30">
              {user?.role}
            </span>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              title="Refresh"
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/20 transition"
            >
              <FiRefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
            MANAGER DASHBOARD
          ═══════════════════════════════════════ */}
      {isManager && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              title="Total Orders"
              value={totals.totalOrders ?? orders.length}
              sub="All time"
              icon={<FiPackage size={20} />}
              iconBg="bg-blue-50" iconColor="text-blue-600"
            />
            <KPICard
              title="Delivered"
              value={totals.deliveredOrders ?? 0}
              sub="Completed"
              icon={<FiCheckCircle size={20} />}
              iconBg="bg-green-50" iconColor="text-green-600"
            />
            <KPICard
              title="Revenue"
              value={`SAR ${money(totals.revenue ?? 0)}`}
              sub="Total collected"
              icon={<FiTrendingUp size={20} />}
              iconBg="bg-indigo-50" iconColor="text-indigo-600"
            />
            <KPICard
              title="Outstanding"
              value={`SAR ${money(totals.outstanding ?? 0)}`}
              sub="Yet to collect"
              icon={<FiAlertTriangle size={20} />}
              iconBg="bg-red-50" iconColor="text-red-500"
              danger
            />
          </div>

          {/* Order Pipeline */}
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-800">Order Pipeline</h2>
                <p className="text-xs text-gray-400">Live count of orders at each stage</p>
              </div>
              <Link to="/orders" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                Manage <FiArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {STATUS_FLOW.map((status) => {
                const count = statusCounts[status] || 0;
                const hex   = STATUS_COLORS[status];
                return (
                  <div key={status} className="text-center p-3 rounded-xl transition hover:scale-105 cursor-default"
                    style={{ background: hex + "15", border: `2px solid ${hex}30` }}>
                    <p className="text-2xl font-bold" style={{ color: hex }}>{count}</p>
                    <p className="text-xs font-medium text-gray-500 mt-1 leading-tight">{status}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue Area Chart */}
            <div className="bg-white rounded-2xl shadow p-5 lg:col-span-2">
              <h2 className="font-semibold text-gray-800">Revenue Trend</h2>
              <p className="text-xs text-gray-400 mb-4">Daily payments collected</p>
              {revenueByDay.length === 0 ? (
                <div className="h-56 flex items-center justify-center">
                  <p className="text-sm text-gray-400">No payment data yet</p>
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueByDay} margin={{ left: -10 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(v) => [`SAR ${money(v)}`, "Revenue"]}
                        contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }}
                      />
                      <Area type="monotone" dataKey="amount"
                        stroke="#6366f1" strokeWidth={3}
                        fill="url(#revGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Orders by Status – horizontal bar */}
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="font-semibold text-gray-800">By Status</h2>
              <p className="text-xs text-gray-400 mb-4">Current distribution</p>
              {byStatus.length === 0 ? (
                <div className="h-56 flex items-center justify-center">
                  <p className="text-sm text-gray-400">No order data</p>
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byStatus} layout="vertical" margin={{ left: 0, right: 10 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="status" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={68} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {byStatus.map(entry => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#6366f1"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">Outstanding Payments</h3>
                  <p className="text-xs text-gray-400">Orders with unpaid balance</p>
                </div>
                <Link to="/payments" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                  View all <FiArrowRight size={11} />
                </Link>
              </div>
              <MiniOrderList
                rows={orders
                  .map(o => ({ ...o, due: Math.max(Number(o.totalAmount || 0) - Number(o.paidAmount || 0), 0) }))
                  .filter(o => o.due > 0)
                  .sort((a, b) => b.due - a.due)
                  .slice(0, 5)}
                showDue
              />
            </div>

            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">Recent Orders</h3>
                  <p className="text-xs text-gray-400">Latest activity</p>
                </div>
                <Link to="/orders" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                  View all <FiArrowRight size={11} />
                </Link>
              </div>
              <MiniOrderList rows={[...orders].slice(0, 5)} />
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════
            STAFF DASHBOARD
          ═══════════════════════════════════════ */}
      {!isManager && (
        <>
          {/* Staff Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl"><FiClock className="text-blue-600" size={18} /></div>
                <div>
                  <p className="text-xs text-gray-500">In Your Queue</p>
                  <p className="text-2xl font-bold text-gray-900">{staffQueue.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 rounded-xl"><FiPackage className="text-green-600" size={18} /></div>
                <div>
                  <p className="text-xs text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                </div>
              </div>
            </div>

            {/* Role quick-action */}
            {(role === "COLLECTOR" || role === "MANAGER") && (
              <Link to="/orders/new"
                className="flex items-center gap-3 bg-blue-600 text-white rounded-2xl shadow p-4 hover:bg-blue-700 transition">
                <div className="p-2.5 bg-white/20 rounded-xl"><FiPackage size={18} /></div>
                <div>
                  <p className="text-xs text-blue-100">Quick Action</p>
                  <p className="font-bold text-sm">New Order</p>
                </div>
              </Link>
            )}
            {role === "CASHIER" && (
              <Link to="/payments"
                className="flex items-center gap-3 bg-green-600 text-white rounded-2xl shadow p-4 hover:bg-green-700 transition">
                <div className="p-2.5 bg-white/20 rounded-xl"><FiDollarSign size={18} /></div>
                <div>
                  <p className="text-xs text-green-100">Quick Action</p>
                  <p className="font-bold text-sm">Payments</p>
                </div>
              </Link>
            )}
          </div>

          {/* Task Queue */}
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">Your Task Queue</h2>
                <p className="text-xs text-gray-400">{getQueueDesc(role)}</p>
              </div>
              {staffQueue.length > 0 && (
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {staffQueue.length} pending
                </span>
              )}
            </div>

            {staffQueue.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FiCheckCircle size={30} className="text-green-500" />
                </div>
                <p className="font-semibold text-gray-700">All caught up!</p>
                <p className="text-sm text-gray-400 mt-1">No pending tasks right now</p>
              </div>
            ) : (
              <div className="space-y-2">
                {staffQueue.slice(0, 10).map((o, i) => {
                  const due = Math.max(Number(o.totalAmount || 0) - Number(o.paidAmount || 0), 0);
                  return (
                    <Link key={o._id} to={`/orders/${o._id}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition group">
                      <div className="w-8 h-8 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{o.customer?.name || "Customer"}</p>
                        <p className="text-xs text-gray-400">#{o._id.slice(-6)}</p>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-1">
                        <StatusChip status={o.status} />
                        {role === "CASHIER" && due > 0 && (
                          <p className="text-xs font-bold text-red-600">SAR {money(due)}</p>
                        )}
                      </div>
                      <FiArrowRight size={14} className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition" />
                    </Link>
                  );
                })}
              </div>
            )}

            {staffQueue.length > 10 && (
              <Link to="/orders" className="block mt-4 text-center text-sm text-blue-600 font-semibold hover:underline">
                View all {staffQueue.length} orders →
              </Link>
            )}
          </div>

          {/* Bottom quick-links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickLink to="/orders" icon={<FiPackage />} label="All Orders" color="text-blue-600" bg="bg-blue-50" />
            {role === "COLLECTOR" && (
              <QuickLink to="/customers" icon={<FiUsers />} label="Customers" color="text-purple-600" bg="bg-purple-50" />
            )}
            {role === "CASHIER" && (
              <QuickLink to="/invoices" icon={<FiFileText />} label="Invoices" color="text-indigo-600" bg="bg-indigo-50" />
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ────────────── Sub-components ────────────── */

function KPICard({ title, value, sub, icon, iconBg, iconColor, danger }) {
  return (
    <div className={`bg-white rounded-2xl shadow p-4 sm:p-5 border ${danger ? "border-red-100" : "border-transparent"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <p className={`text-xl sm:text-2xl font-bold mt-1 truncate ${danger ? "text-red-600" : "text-gray-900"}`}>
            {value}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ status }) {
  const cls = STATUS_BADGE[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

function MiniOrderList({ rows, showDue }) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">Nothing to show</p>;
  }
  return (
    <div className="space-y-1">
      {rows.map(o => (
        <Link key={o._id} to={`/orders/${o._id}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition group border border-transparent hover:border-gray-200">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{o.customer?.name || "Customer"}</p>
            <p className="text-xs text-gray-400">#{o._id.slice(-6)}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <StatusChip status={o.status} />
            {showDue && (
              <p className="text-xs font-bold text-red-600 mt-0.5">SAR {money(o.due || 0)}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function QuickLink({ to, icon, label, color, bg }) {
  return (
    <Link to={to} className="bg-white rounded-xl shadow p-4 flex items-center gap-3 hover:bg-gray-50 transition">
      <div className={`p-2 rounded-lg ${bg}`}>
        <span className={`${color} text-base`}>{icon}</span>
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );
}

/* ────────────── Helpers ────────────── */

function getTimeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

function getRoleDesc(role) {
  const map = {
    MANAGER:   "Here's your business overview for today.",
    COLLECTOR: "Pick up orders and mark them as received.",
    WASHER:    "Wash received orders and move them to sorting.",
    SORTER:    "Sort washed items and prepare them for ironing.",
    IRONER:    "Iron sorted clothes and mark them as ready.",
    DRIVER:    "Deliver ready orders to customers.",
    CASHIER:   "Collect payments and manage outstanding balances.",
  };
  return map[role] || "Track and manage laundry orders.";
}

function getQueueDesc(role) {
  const map = {
    COLLECTOR: "Picked orders waiting to be marked received",
    WASHER:    "Received orders ready to be washed",
    SORTER:    "Washed orders ready to sort for ironing",
    IRONER:    "Sorted orders ready to iron",
    DRIVER:    "Orders packed and ready for delivery",
    CASHIER:   "Orders with outstanding payment balance",
  };
  return map[role] || "Your pending tasks";
}

function money(n) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
