import { useEffect, useState } from "react";
import { API, authHeader } from "../api";
import Toast from "../components/Toast";

const emptyForm = { name: "", phone: "", type: "Regular", address: "" };

export default function CustomerManagement({ user }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ type: "", message: "" });

  const isManager = user?.role === "Manager";

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/customers?all=1`, { headers: authHeader() });
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      showToast("error", "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (c) => {
    setForm({ name: c.name, phone: c.phone || "", type: c.type, address: c.address || "" });
    setEditId(c._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast("error", "Name is required");
    try {
      setSubmitting(true);
      const url = editId ? `${API}/customers/${editId}` : `${API}/customers`;
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      showToast("success", editId ? "Customer updated" : "Customer created");
      resetForm();
      load();
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      const res = await fetch(`${API}/customers/${c._id}/toggle`, {
        method: "PATCH",
        headers: authHeader(),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("success", c.active ? "Customer deactivated" : "Customer activated");
      load();
    } catch (e) {
      showToast("error", e.message);
    }
  };

  const filtered = customers.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  const active = filtered.filter(c => c.active);
  const inactive = filtered.filter(c => !c.active);

  return (
    <div className="space-y-6">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "", message: "" })} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-gray-500">{active.length} active customer(s)</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Customer</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold mb-4">{editId ? "Edit Customer" : "New Customer"}</h2>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" placeholder="Full name"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" placeholder="050xxxxxxx"
                value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white"
                value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="Regular">Regular</option>
                <option value="Hotel">Hotel</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" placeholder="Area / Street"
                value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={submitting} className={`btn-primary ${submitting ? "opacity-60" : ""}`}>
                {submitting ? "Saving..." : editId ? "Update" : "Create"}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div>
        <input type="text" placeholder="Search by name or phone..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>

      {/* Active customers */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b"><h2 className="font-semibold">Active Customers</h2></div>
        {loading ? (
          <p className="p-4 text-sm text-gray-500">Loading...</p>
        ) : active.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No customers found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Address</th>
                {isManager && <th className="text-right px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {active.map(c => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.type === "Hotel" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{c.address || "—"}</td>
                  {isManager && (
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => toggleActive(c)} className="text-red-500 hover:underline">Deactivate</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inactive */}
      {inactive.length > 0 && isManager && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b"><h2 className="font-semibold text-gray-500">Inactive ({inactive.length})</h2></div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {inactive.map(c => (
                <tr key={c._id} className="opacity-50 hover:opacity-70">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{c.type}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleActive(c)} className="text-green-600 hover:underline">Activate</button>
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