import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API, authHeader } from "../api.js";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/orders`, {
        headers: { ...authHeader() },
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`GET /orders failed: ${res.status} ${msg}`);
      }

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;

    const revenuePaid = orders.reduce((sum, o) => {
      return sum + Number(o.paidAmount || 0);
    }, 0);

    const outstandingAmount = orders.reduce((sum, o) => {
      const total = Number(o.totalAmount || 0);
      const paid = Number(o.paidAmount || 0);
      return sum + Math.max(total - paid, 0);
    }, 0);

    const outstandingCount = orders.filter((o) => {
      const total = Number(o.totalAmount || 0);
      const paid = Number(o.paidAmount || 0);
      return paid < total;
    }).length;

    const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;

    return {
      totalOrders,
      revenuePaid,
      outstandingAmount,
      outstandingCount,
      deliveredCount,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-red-600 font-semibold">Failed to load dashboard</p>
        <p className="text-gray-600 text-sm mt-1">{error}</p>
        <button className="btn-secondary mt-4" onClick={fetchOrders}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button className="btn-secondary" onClick={fetchOrders}>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Orders" value={stats.totalOrders} />
        <StatCard title="Revenue (Paid)" value={formatMoney(stats.revenuePaid)} />
        <StatCard
          title={`Outstanding (${stats.outstandingCount})`}
          value={formatMoney(stats.outstandingAmount)}
        />
        <StatCard title="Delivered" value={stats.deliveredCount} />
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold mb-3">Quick Actions</h2>
        <div className="flex gap-4 flex-wrap">
          <Link to="/orders" className="btn-primary">
            View Orders
          </Link>
          <Link to="/payments" className="btn-secondary">
            Add Payment
          </Link>
          <Link to="/reports" className="btn-secondary">
            Reports
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function formatMoney(value) {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
