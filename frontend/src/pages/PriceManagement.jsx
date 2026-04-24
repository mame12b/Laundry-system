import { useEffect, useState } from "react";
import { API, apiFetch } from "../api";
import Toast from "../components/Toast";

const UNITS = ["pc", "kg", "pair", "set", "shirt", "trouser", "suit", "bag"];

const emptyForm = { name: "", pricePerUnit: "", unit: "pc" };

export default function PriceManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });
  const [showForm, setShowForm] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API}/prices?all=1`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      showToast("error", "Failed to load price items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (item) => {
    setForm({
      name: item.name || "",
      pricePerUnit: item.pricePerUnit ?? "",
      unit: UNITS.includes(item.unit) ? item.unit : "pc",
    });
    setEditId(item._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.pricePerUnit || !form.unit) {
      return showToast("error", "All fields are required");
    }
    try {
      setSubmitting(true);
      const url = editId ? `${API}/prices/${editId}` : `${API}/prices`;
      const method = editId ? "PATCH" : "POST";
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, pricePerUnit: Number(form.pricePerUnit) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      showToast("success", editId ? "Item updated" : "Item created");
      resetForm();
      load();
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      const res = await apiFetch(`${API}/prices/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      showToast("success", item.active ? "Deactivated" : "Activated");
      load();
    } catch (e) {
      showToast("error", e.message);
    }
  };

  const activeItems = items.filter(i => i.active);
  const inactiveItems = items.filter(i => !i.active);

  return (
    <div className="space-y-6">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "", message: "" })} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Price Management</h1>
          <p className="text-sm text-gray-500">{activeItems.length} active item(s)</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Add Item</button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold mb-4">{editId ? "Edit Item" : "New Price Item"}</h2>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Item Name</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Shirt"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Price per Unit</label>
              <input type="number" min="0" step="0.01" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" placeholder="0.00"
                value={form.pricePerUnit} onChange={e => setForm(p => ({ ...p, pricePerUnit: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Unit</label>
              <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white"
                value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button type="submit" disabled={submitting}
                className={`btn-primary ${submitting ? "opacity-60" : ""}`}>
                {submitting ? "Saving..." : editId ? "Update" : "Create"}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Active items table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b"><h2 className="font-semibold">Active Items</h2></div>
        {loading ? (
          <p className="p-4 text-sm text-gray-500">Loading...</p>
        ) : activeItems.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No active items. Add one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Unit</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeItems.map(item => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">per {item.unit}</td>
                  <td className="px-4 py-3 text-right font-semibold">{Number(item.pricePerUnit).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => toggleActive(item)} className="text-red-500 hover:underline">Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inactive items */}
      {inactiveItems.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b"><h2 className="font-semibold text-gray-500">Inactive Items ({inactiveItems.length})</h2></div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {inactiveItems.map(item => (
                <tr key={item._id} className="opacity-50">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">per {item.unit}</td>
                  <td className="px-4 py-3 text-right">{Number(item.pricePerUnit).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleActive(item)} className="text-green-600 hover:underline">Activate</button>
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