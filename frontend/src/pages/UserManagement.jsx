import { useEffect, useState } from "react";
import { API, authHeader } from "../api";
import Toast from "../components/Toast";

const ROLES = ["Collector","Washer","Sorter","Ironer","Driver","Cashier","Manager","Hotel"];
const ROLE_COLORS = {
  Manager: "bg-blue-100 text-blue-800",
  Cashier: "bg-green-100 text-green-800",
  Collector: "bg-orange-100 text-orange-800",
  Washer: "bg-yellow-100 text-yellow-800",
  Sorter: "bg-purple-100 text-purple-800",
  Ironer: "bg-pink-100 text-pink-800",
  Driver: "bg-indigo-100 text-indigo-800",
  Hotel: "bg-teal-100 text-teal-800",
};

const emptyForm = { name: "", phone: "", role: "Collector", password: "" };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [toast, setToast] = useState({ type: "", message: "" });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/users`, { headers: authHeader() });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      showToast("error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password) return showToast("error", "Name, phone and password required");
    try {
      setSubmitting(true);
      const res = await fetch(`${API}/users`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create user");
      showToast("success", "User created");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      const res = await fetch(`${API}/users/${u._id}/toggle`, {
        method: "PATCH",
        headers: authHeader(),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("success", u.active ? "User deactivated" : "User activated");
      load();
    } catch (e) {
      showToast("error", e.message);
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.phone?.includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const active = filtered.filter(u => u.active);
  const inactive = filtered.filter(u => !u.active);

  return (
    <div className="space-y-6">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "", message: "" })} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-gray-500">{users.filter(u => u.active).length} active staff</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(p => !p)}>+ New User</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold mb-4">Create New User</h2>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Full Name *</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Ahmed Ali"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Phone *</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" placeholder="050xxxxxxx"
                value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white"
                value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Password *</label>
              <input type="password" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" placeholder="Min 4 chars"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={submitting} className={`btn-primary ${submitting ? "opacity-60" : ""}`}>
                {submitting ? "Creating..." : "Create User"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <input type="text" placeholder="Search name or phone..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Role summary chips */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(r => {
          const count = users.filter(u => u.active && u.role === r).length;
          if (!count) return null;
          return (
            <button key={r} onClick={() => setRoleFilter(roleFilter === r ? "" : r)}
              className={`text-xs px-3 py-1 rounded-full font-medium border transition ${roleFilter === r ? "border-blue-500 bg-blue-50" : "border-transparent"} ${ROLE_COLORS[r] || "bg-gray-100 text-gray-700"}`}>
              {r} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b"><h2 className="font-semibold">Active Staff ({active.length})</h2></div>
        {loading ? (
          <p className="p-4 text-sm text-gray-500">Loading...</p>
        ) : active.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No users found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {active.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-700"}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleActive(u)} className="text-red-500 hover:underline text-xs">Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {inactive.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b"><h2 className="font-semibold text-gray-500">Inactive Staff ({inactive.length})</h2></div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {inactive.map(u => (
                <tr key={u._id} className="opacity-50">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || "bg-gray-100"}`}>{u.role}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleActive(u)} className="text-green-600 hover:underline text-xs">Activate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}