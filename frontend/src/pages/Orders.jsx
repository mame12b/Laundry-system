import { useEffect, useMemo, useState } from "react";
import { API, apiFetch } from "../api.js";
import OrderCard from "../components/OrderCard";
import Toast from "../components/Toast";
import { Link } from "react-router-dom";

const ALL_STATUSES = ["PICKED","RECEIVED","WASHING","IRONING","READY","DELIVERED"];

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: "", message: "" });
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch(`${API}/orders`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load orders");
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Network error");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const role = user?.role || "";

  // Role-based default visibility (operational staff see only their relevant status)
  const roleVisibleStatuses = {
    Washer: ["RECEIVED"],
    Sorter: ["WASHING"],
    Ironer: ["IRONING"],
    Driver: ["READY"],
  };

  const visibleOrders = useMemo(() => {
    let list = orders;

    // Apply role filter first (operational roles see only relevant orders)
    const roleFilter = roleVisibleStatuses[role];
    if (roleFilter && !statusFilter) {
      list = list.filter(o => roleFilter.includes(o.status));
    }

    // Status filter
    if (statusFilter) list = list.filter(o => o.status === statusFilter);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.customer?.name?.toLowerCase().includes(q) ||
        o._id?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [orders, role, statusFilter, search]);

  const canCreate = role === "Collector" || role === "Manager";
  const showFilters = ["Manager", "Cashier", "Collector"].includes(role);

  return (
    <div className="space-y-4">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "", message: "" })} />

      {/* Header */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Orders</h1>
            <p className="text-xs text-gray-500">Showing {visibleOrders.length} of {orders.length} order(s)</p>
          </div>
          <div className="flex gap-2">
            {canCreate && (
              <Link to="/orders/new" className="inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 transition text-sm">
                + Create
              </Link>
            )}
            <button onClick={loadOrders} className="inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold text-white bg-green-600 hover:bg-green-700 transition text-sm">
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <input
              type="text"
              placeholder="Search by customer name or order ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">All statuses</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      {loading && <div className="bg-white rounded-xl shadow p-4"><p className="text-gray-500 text-sm">Loading orders...</p></div>}
      {!loading && error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}
      {!loading && !error && visibleOrders.length === 0 && (
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-gray-500">No orders found.</p></div>
      )}

      {!loading && !error && visibleOrders.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {visibleOrders.map(order => (
            <OrderCard key={order._id} order={order} user={user} onUpdated={loadOrders} onToast={showToast} />
          ))}
        </div>
      )}
    </div>
  );
}