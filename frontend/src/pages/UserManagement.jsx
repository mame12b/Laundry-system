import { useEffect, useState } from "react";
import { API, apiFetch } from "../api";
import Toast from "../components/Toast";
import {
  FiUserPlus, FiX, FiCopy, FiCheck, FiLock,
  FiSearch, FiUserCheck, FiUserX,
} from "react-icons/fi";

const ROLES = ["Collector","Washer","Sorter","Ironer","Driver","Cashier","Manager","Hotel"];

const ROLE_COLORS = {
  Manager:   "bg-blue-100 text-blue-800",
  Cashier:   "bg-green-100 text-green-800",
  Collector: "bg-orange-100 text-orange-800",
  Washer:    "bg-yellow-100 text-yellow-800",
  Sorter:    "bg-purple-100 text-purple-800",
  Ironer:    "bg-pink-100 text-pink-800",
  Driver:    "bg-indigo-100 text-indigo-800",
  Hotel:     "bg-teal-100 text-teal-800",
};

const emptyForm = { name: "", phone: "", role: "Collector" };

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function UserManagement() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(emptyForm);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [toast, setToast]         = useState({ type: "", message: "" });
  const [pinModal, setPinModal]   = useState(null); // { name, role, pin }
  const [copied, setCopied]       = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res  = await apiFetch(`${API}/users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      showToast("error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      return showToast("error", "Name and phone are required");
    }

    const pin = generatePin();

    try {
      setSubmitting(true);
      const res = await apiFetch(`${API}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name: form.name.trim(), phone: form.phone.trim(), password: pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create user");

      setForm(emptyForm);
      setShowForm(false);
      load();
      setPinModal({ name: form.name.trim(), role: form.role, pin });
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      const res = await apiFetch(`${API}/users/${u._id}/toggle`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
      showToast("success", u.active ? "User deactivated" : "User activated");
      load();
    } catch {
      showToast("error", "Action failed");
    }
  };

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(pinModal.pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available in some browsers — silently ignore
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.phone?.includes(q);
    const matchRole   = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const active   = filtered.filter(u => u.active);
  const inactive = filtered.filter(u => !u.active);

  return (
    <div className="space-y-6">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "", message: "" })} />

      {/* ── PIN Reveal Modal ─────────────────────────────────── */}
      {pinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-6 text-white text-center">
              <div className="w-12 h-12 bg-white/25 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/30">
                <FiCheck size={22} strokeWidth={3} />
              </div>
              <h2 className="text-lg font-bold">Account Created!</h2>
              <p className="text-green-100 text-sm mt-0.5">Share this PIN with {pinModal.name}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Role badge */}
              <div className="flex justify-center">
                <span className={`text-xs font-semibold px-4 py-1.5 rounded-full ${ROLE_COLORS[pinModal.role] || "bg-gray-100 text-gray-700"}`}>
                  {pinModal.role}
                </span>
              </div>

              {/* PIN display */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-center">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                  <FiLock size={11} /> Login PIN
                </p>
                <div className="flex justify-center gap-3 mb-4">
                  {pinModal.pin.split("").map((digit, i) => (
                    <div key={i}
                      className="w-[52px] h-[60px] bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-3xl font-bold text-white select-none">
                      {digit}
                    </div>
                  ))}
                </div>
                <button
                  onClick={copyPin}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/10"
                >
                  {copied ? <><FiCheck size={12}/> Copied!</> : <><FiCopy size={12}/> Copy PIN</>}
                </button>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <p className="text-amber-800 text-xs font-medium leading-relaxed">
                  This PIN will not be shown again.<br />
                  Give it directly to <b>{pinModal.name}</b> to use at login.
                </p>
              </div>

              <button
                onClick={() => { setPinModal(null); setCopied(false); }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.filter(u => u.active).length} active staff members
          </p>
        </div>
        <button
          onClick={() => setShowForm(p => !p)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow"
        >
          <FiUserPlus size={16} />
          {showForm ? "Cancel" : "New Staff"}
        </button>
      </div>

      {/* ── Create Form ───────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">Create Staff Account</h2>
              <p className="text-xs text-gray-400 mt-0.5">A 4-digit login PIN will be auto-generated</p>
            </div>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name *</label>
              <input
                className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Ahmed Ali"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone *</label>
              <input
                className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 0912345678"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select
                className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Auto-PIN hint */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 self-end">
              <FiLock size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-blue-700 text-xs leading-relaxed">
                A <b>4-digit PIN</b> is generated automatically. You'll see it after saving.
              </p>
            </div>

            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition ${
                  submitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {submitting ? "Creating…" : "Create & Generate PIN"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* ── Role summary chips ────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(r => {
          const count = users.filter(u => u.active && u.role === r).length;
          if (!count) return null;
          return (
            <button key={r}
              onClick={() => setRoleFilter(roleFilter === r ? "" : r)}
              className={`text-xs px-3 py-1 rounded-full font-medium border transition
                ${roleFilter === r ? "border-blue-500 ring-1 ring-blue-300" : "border-transparent"}
                ${ROLE_COLORS[r] || "bg-gray-100 text-gray-700"}`}>
              {r} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Active Staff Table ────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Active Staff ({active.length})</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : active.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">No active staff found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Phone</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Joined</th>
                <th className="text-right px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {active.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{u.phone}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-700"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs hidden md:table-cell">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => toggleActive(u)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition"
                    >
                      <FiUserX size={13} /> Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Inactive Staff ────────────────────────────────────── */}
      {inactive.length > 0 && (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-400">Inactive Staff ({inactive.length})</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {inactive.map(u => (
                <tr key={u._id} className="opacity-50 hover:opacity-70 transition">
                  <td className="px-5 py-3 font-medium">{u.name}</td>
                  <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{u.phone}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ROLE_COLORS[u.role] || "bg-gray-100"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => toggleActive(u)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 transition"
                    >
                      <FiUserCheck size={13} /> Reactivate
                    </button>
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
