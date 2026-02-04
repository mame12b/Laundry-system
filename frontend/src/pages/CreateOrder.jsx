import { useEffect, useMemo, useState } from "react";
import { API, authHeader } from "../api";
import { useNavigate } from "react-router-dom";

export default function CreateOrder({ user }) {
  const navigate = useNavigate();
  const role = (user?.role || "").toUpperCase();

  const [customers, setCustomers] = useState([]);
  const [prices, setPrices] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [rows, setRows] = useState([{ itemId: "", qty: 1 }]);

  // inline customer creation modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cType, setCType] = useState("Individual");
  const [cAddress, setCAddress] = useState("");
  const [cLoading, setCLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const showMsg = (type, text) => setMsg({ type, text });

  // only Collector/Manager
  if (role !== "COLLECTOR" && role !== "MANAGER") {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <p className="text-red-600 font-semibold">Access denied</p>
      </div>
    );
  }

  // load customers + prices
  useEffect(() => {
    const load = async () => {
      try {
        showMsg("", "");

        const [cRes, pRes] = await Promise.all([
          fetch(`${API}/customers`, { headers: authHeader() }),
          fetch(`${API}/prices`, { headers: authHeader() }),
        ]);

        const cData = await cRes.json().catch(() => []);
        const pData = await pRes.json().catch(() => []);

        if (!cRes.ok) throw new Error(cData.message || "Failed to load customers");
        if (!pRes.ok) throw new Error(pData.message || "Failed to load prices");

        setCustomers(Array.isArray(cData) ? cData : []);
        setPrices(Array.isArray(pData) ? pData : []);
      } catch (e) {
        showMsg("error", e.message || "Failed to load form data");
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const priceMap = useMemo(() => {
    const m = new Map();
    prices.forEach((it) => m.set(it._id, it));
    return m;
  }, [prices]);

  const totalPreview = useMemo(() => {
    return rows.reduce((sum, r) => {
      const it = priceMap.get(r.itemId);
      const unitPrice = Number(it?.price || 0);
      const qty = Number(r.qty || 0);
      return sum + unitPrice * qty;
    }, 0);
  }, [rows, priceMap]);

  const addRow = () => setRows((prev) => [...prev, { itemId: "", qty: 1 }]);
  const removeRow = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx));
  const updateRow = (idx, patch) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  // Create customer
  const createCustomer = async () => {
    if (!cName.trim()) return showMsg("error", "Customer name is required");

    try {
      setCLoading(true);
      showMsg("", "");

      const res = await fetch(`${API}/customers`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cName.trim(),
          phone: cPhone.trim(),
          type: cType,
          address: cAddress.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.message || "Failed to create customer");

      setCustomers((prev) => [data, ...prev]);
      setCustomerId(data._id);

      setCName("");
      setCPhone("");
      setCType("Individual");
      setCAddress("");
      setShowCustomerModal(false);

      showMsg("success", "Customer created");
    } catch (e) {
      showMsg("error", e.message || "Customer creation failed");
    } finally {
      setCLoading(false);
    }
  };

  // Submit order
  const submit = async (e) => {
    e.preventDefault();

    if (!customerId) return showMsg("error", "Please select a customer.");

    const cleanRows = rows
      .map((r) => ({ itemId: r.itemId, qty: Number(r.qty) }))
      .filter((r) => r.itemId && r.qty > 0);

    if (cleanRows.length === 0) return showMsg("error", "Add at least 1 item.");

    const itemsPayload = cleanRows.map((r) => {
      const it = priceMap.get(r.itemId);
      return {
        item: r.itemId,
        qty: r.qty,
        price: Number(it?.price || 0),
      };
    });

    // validate item has a price
    if (itemsPayload.some((x) => !x.price && x.price !== 0)) {
      return showMsg("error", "Some items have invalid price");
    }

    try {
      setLoading(true);
      showMsg("", "");

      const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customerId,
          items: itemsPayload,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create order");

      showMsg("success", "Order created successfully");
      setTimeout(() => navigate("/orders"), 600);
    } catch (e) {
      showMsg("error", e.message || "Order creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collect Order</h1>
          <p className="text-sm text-gray-500">
            Collector fills customer + items, then submits.
          </p>
        </div>
        <button className="btn-secondary" onClick={() => navigate("/orders")}>
          Back
        </button>
      </div>

      {msg.text && (
        <div
          className={`px-4 py-2 rounded text-sm ${
            msg.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={submit} className="bg-white rounded-2xl shadow p-6 space-y-6">
        {/* Customer */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.type ? `(${c.type})` : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowCustomerModal(true)}
          >
            + New Customer
          </button>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Laundry Items</h2>
            <button type="button" className="btn-secondary" onClick={addRow}>
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {rows.map((r, idx) => {
              const it = priceMap.get(r.itemId);
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 border rounded-xl p-3"
                >
                  <div className="md:col-span-7">
                    <label className="block text-xs text-gray-500 mb-1">Item</label>
                    <select
                      value={r.itemId}
                      onChange={(e) => updateRow(idx, { itemId: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="">Select item...</option>
                      {prices.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} — {p.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={r.qty}
                      onChange={(e) => updateRow(idx, { qty: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-end justify-between gap-2">
                    <div className="text-sm text-gray-600">
                      {it ? (
                        <span>
                          Unit: <b>{it.price}</b>
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </div>

                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total preview */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
          <span className="text-sm text-gray-600">Total (preview)</span>
          <span className="text-xl font-bold">{totalPreview.toFixed(2)}</span>
        </div>

        <button
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-semibold ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Saving..." : "Create Order"}
        </button>
      </form>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">New Customer</h3>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <label className="text-sm text-gray-600">Name *</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="Customer name"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Phone (optional)</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value)}
                  placeholder="050xxxxxxx"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Type</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 bg-white"
                  value={cType}
                  onChange={(e) => setCType(e.target.value)}
                >
                  <option value="Individual">Individual</option>
                  <option value="Hotel">Hotel</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Address (optional)</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={cAddress}
                  onChange={(e) => setCAddress(e.target.value)}
                  placeholder="Area / Street"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => setShowCustomerModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn-primary flex-1 ${cLoading ? "opacity-60" : ""}`}
                  onClick={createCustomer}
                  disabled={cLoading}
                >
                  {cLoading ? "Saving..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
