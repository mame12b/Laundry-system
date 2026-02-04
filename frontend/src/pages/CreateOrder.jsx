import { useEffect, useMemo, useState } from "react";
import { API, authHeader } from "../api";
import { useNavigate } from "react-router-dom";

export default function CreateOrder({ user }) {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [priceItems, setPriceItems] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [rows, setRows] = useState([{ itemId: "", qty: 1 }]);

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  // load customers + price items
  useEffect(() => {
    const load = async () => {
      try {
        setPageError("");

        const [cRes, pRes] = await Promise.all([
          fetch(`${API}/customers`, { headers: authHeader() }),
          fetch(`${API}/price-items`, { headers: authHeader() }),
        ]);

        if (!cRes.ok) throw new Error("Failed to load customers");
        if (!pRes.ok) throw new Error("Failed to load price items");

        const cData = await cRes.json();
        const pData = await pRes.json();

        setCustomers(Array.isArray(cData) ? cData : []);
        setPriceItems(Array.isArray(pData) ? pData : []);
      } catch (e) {
        setPageError(e.message || "Failed to load form data");
      }
    };
    load();
  }, []);

  const itemMap = useMemo(() => {
    const m = new Map();
    priceItems.forEach((it) => m.set(it._id, it));
    return m;
  }, [priceItems]);

  const totalPreview = useMemo(() => {
    return rows.reduce((sum, r) => {
      const it = itemMap.get(r.itemId);
      const price = Number(it?.price || 0);
      const qty = Number(r.qty || 0);
      return sum + price * qty;
    }, 0);
  }, [rows, itemMap]);

  const addRow = () => setRows((prev) => [...prev, { itemId: "", qty: 1 }]);
  const removeRow = (idx) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const updateRow = (idx, patch) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const submit = async (e) => {
    e.preventDefault();

    // validations
    if (!customerId) return setPageError("Please select a customer.");
    const cleanRows = rows
      .map((r) => ({ itemId: r.itemId, qty: Number(r.qty) }))
      .filter((r) => r.itemId && r.qty > 0);

    if (cleanRows.length === 0) return setPageError("Add at least 1 item.");

    try {
      setLoading(true);
      setPageError("");

      // backend expects: items: [{ item, qty, price }]
      const payload = {
        customer: customerId,
        items: cleanRows.map((r) => {
          const it = itemMap.get(r.itemId);
          return {
            item: r.itemId,
            qty: r.qty,
            price: Number(it?.price || 0),
          };
        }),
      };

      const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      // go back to orders list
      navigate("/orders");
    } catch (e) {
      setPageError(e.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  // Optional: only collector/manager can view this page
  const role = (user?.role || "").toUpperCase();
  if (role !== "COLLECTOR" && role !== "MANAGER") {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <p className="text-red-600 font-semibold">Access denied</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Collect Order</h1>
          <p className="text-sm text-gray-500">
            Record clothes collection from customer
          </p>
        </div>
        <button className="btn-secondary" onClick={() => navigate("/orders")}>
          Back
        </button>
      </div>

      {pageError && (
        <div className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded mb-4">
          {pageError}
        </div>
      )}

      <form onSubmit={submit} className="bg-white rounded-2xl shadow p-6 space-y-6">
        {/* Customer */}
        <div>
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

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Items</h2>
            <button type="button" className="btn-secondary" onClick={addRow}>
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {rows.map((r, idx) => {
              const it = itemMap.get(r.itemId);
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 border rounded-xl p-3"
                >
                  <div className="md:col-span-7">
                    <label className="block text-xs text-gray-500 mb-1">
                      Item
                    </label>
                    <select
                      value={r.itemId}
                      onChange={(e) => updateRow(idx, { itemId: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="">Select item...</option>
                      {priceItems.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} — {p.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">
                      Qty
                    </label>
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
                      {it ? <span>Unit: <b>{it.price}</b></span> : <span>—</span>}
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
    </div>
  );
}
