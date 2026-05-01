import { useEffect, useMemo, useState } from "react";
import { API, apiFetch } from "../api";
import { useNavigate } from "react-router-dom";
import {
  FiSearch, FiX, FiPlus, FiMinus, FiUser,
  FiPhone, FiMapPin, FiCheck, FiShoppingCart, FiArrowLeft,
} from "react-icons/fi";

export default function CreateOrder({ user }) {
  const navigate = useNavigate();
  const role = (user?.role || "").toUpperCase();

  const [customers, setCustomers]   = useState([]);
  const [prices, setPrices]         = useState([]);
  const [loadError, setLoadError]   = useState("");

  // customer selection
  const [customerSearch, setCustomerSearch]   = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showList, setShowList]               = useState(false);

  // inline new-customer form
  const [showNewForm, setShowNewForm] = useState(false);
  const [cName, setCName]   = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cType, setCType]   = useState("Individual");
  const [cAddr, setCAddr]   = useState("");
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError]     = useState("");

  // cart: { priceItemId: qty }
  const [cart, setCart] = useState({});

  const [loading, setLoading]       = useState(false);
  const [submitError, setSubmitError] = useState("");

useEffect(() => {
  const loadData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        apiFetch(`${API}/customers`),
        apiFetch(`${API}/prices`),
      ]);

      const cData = await cRes.json().catch(() => []);
      const pData = await pRes.json().catch(() => []);

      if (!cRes.ok) throw new Error(cData.message || "Failed to load customers");
      if (!pRes.ok) throw new Error(pData.message || "Failed to load prices");

      setCustomers(Array.isArray(cData) ? cData : []);
      setPrices(Array.isArray(pData) ? pData : []);
    } catch (e) {
      setLoadError(e.message);
    }
  };

  loadData();
}, []);


  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    const list = q
      ? customers.filter(c =>
          c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
        )
      : customers;
    return list.slice(0, 7);
  }, [customers, customerSearch]);

  const addToCart    = (id) => setCart(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const removeFromCart = (id) => setCart(p => {
    const n = { ...p };
    if (n[id] > 1) n[id]--;
    else delete n[id];
    return n;
  });

  const cartItems = useMemo(() =>
    prices
      .filter(p => cart[p._id])
      .map(p => ({ ...p, qty: cart[p._id], subtotal: p.pricePerUnit * cart[p._id] })),
    [prices, cart]
  );

  const total = useMemo(() => cartItems.reduce((s, i) => s + i.subtotal, 0), [cartItems]);

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setShowList(false);
    setShowNewForm(false);
  };

  const openNewForm = () => {
    setCName(customerSearch.trim());
    setShowNewForm(true);
    setShowList(false);
    setCError("");
  };

  const createCustomer = async () => {
    if (!cName.trim()) { setCError("Name is required"); return; }
    setCError("");
    try {
      setCLoading(true);
      const res = await apiFetch(`${API}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cName.trim(), phone: cPhone.trim(),
          type: cType, address: cAddr.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create customer");
      setCustomers(prev => [data, ...prev]);
      selectCustomer(data);
      setCName(""); setCPhone(""); setCType("Individual"); setCAddr("");
    } catch (e) {
      setCError(e.message);
    } finally {
      setCLoading(false);
    }
  };

  const submit = async () => {
    if (!selectedCustomer) { setSubmitError("Please select a customer"); return; }
    if (cartItems.length === 0) { setSubmitError("Add at least one item"); return; }
    setSubmitError("");
    try {
      setLoading(true);
      const res = await apiFetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: selectedCustomer._id,
          items: cartItems.map(i => ({ item: i._id, qty: i.qty, price: i.pricePerUnit })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create order");
      navigate("/orders");
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (role !== "COLLECTOR" && role !== "MANAGER") {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <p className="text-red-600 font-semibold">Access denied</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-36 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/orders")}
          className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-600"
        >
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Order</h1>
          <p className="text-sm text-gray-400">Collect laundry from customer</p>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {loadError}
        </div>
      )}

      {/* ── Step 1: Customer ───────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedCustomer ? "bg-green-500 text-white" : "bg-blue-600 text-white"}`}>
            {selectedCustomer ? <FiCheck size={12} /> : "1"}
          </span>
          <h2 className="font-semibold text-gray-900">Customer</h2>
        </div>

        {selectedCustomer ? (
          /* Selected state */
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {selectedCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{selectedCustomer.name}</p>
              <p className="text-xs text-gray-500">
                {selectedCustomer.phone || "No phone"} · {selectedCustomer.type}
              </p>
            </div>
            <button
              onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); setShowList(true); }}
              className="p-1.5 text-gray-400 hover:text-red-500 transition"
            >
              <FiX size={16} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Search input */}
            <div className="relative">
              <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name or phone…"
                value={customerSearch}
                onChange={e => { setCustomerSearch(e.target.value); setShowList(true); setShowNewForm(false); }}
                onFocus={() => setShowList(true)}
                className="w-full border rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {customerSearch && (
                <button
                  onClick={() => { setCustomerSearch(""); setShowList(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            {/* Dropdown list */}
            {showList && !showNewForm && filteredCustomers.length > 0 && (
              <div className="border rounded-xl overflow-hidden divide-y shadow-sm">
                {filteredCustomers.map(c => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition text-left"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold text-xs flex-shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone || "No phone"} · {c.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* New customer button */}
            {!showNewForm && (
              <button
                type="button"
                onClick={openNewForm}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 text-sm font-semibold hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <FiPlus size={16} />
                {customerSearch.trim()
                  ? <>New customer &ldquo;<span className="font-bold">{customerSearch}</span>&rdquo;</>
                  : "New Customer"}
              </button>
            )}

            {/* Inline new-customer form */}
            {showNewForm && (
              <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-blue-800">New Customer</p>
                  <button type="button" onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600">
                    <FiX size={16} />
                  </button>
                </div>

                {cError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{cError}</p>
                )}

                {/* Name */}
                <div className="relative">
                  <FiUser size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    placeholder="Name *"
                    value={cName}
                    onChange={e => setCName(e.target.value)}
                    className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Phone */}
                  <div className="relative">
                    <FiPhone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      placeholder="Phone"
                      value={cPhone}
                      onChange={e => setCPhone(e.target.value)}
                      className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {/* Type */}
                  <select
                    value={cType}
                    onChange={e => setCType(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Regular">Regular</option>
                  </select>
                </div>

                {/* Address */}
                <div className="relative">
                  <FiMapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    placeholder="Address (optional)"
                    value={cAddr}
                    onChange={e => setCAddr(e.target.value)}
                    className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={createCustomer}
                  disabled={cLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
                >
                  {cLoading ? "Creating…" : "Create & Select"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Step 2: Items ──────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${cartItems.length > 0 ? "bg-green-500 text-white" : "bg-blue-600 text-white"}`}>
            {cartItems.length > 0 ? <FiCheck size={12} /> : "2"}
          </span>
          <h2 className="font-semibold text-gray-900">Items</h2>
          {cartItems.length > 0 && (
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {cartItems.reduce((s, i) => s + i.qty, 0)} pcs
            </span>
          )}
        </div>

        {prices.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {prices.map(p => {
              const qty = cart[p._id] || 0;
              const selected = qty > 0;
              return (
                <div
                  key={p._id}
                  onClick={() => !selected && addToCart(p._id)}
                  className={`relative rounded-xl border-2 p-3 transition select-none ${
                    selected
                      ? "border-blue-500 bg-blue-50 cursor-default"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  {selected && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <FiCheck size={9} className="text-white" />
                    </span>
                  )}
                  <p className="text-sm font-semibold text-gray-900 leading-tight pr-4">{p.name}</p>
                  <p className="text-xs text-blue-600 font-medium mt-0.5">
                    {p.pricePerUnit} <span className="text-gray-400 font-normal">/{p.unit}</span>
                  </p>

                  {selected && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-blue-200">
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); removeFromCart(p._id); }}
                        className="w-7 h-7 rounded-full bg-white border border-blue-300 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition"
                      >
                        <FiMinus size={11} />
                      </button>
                      <span className="flex-1 text-center text-sm font-bold text-gray-900">{qty}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); addToCart(p._id); }}
                        className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition"
                      >
                        <FiPlus size={11} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {submitError}
        </div>
      )}

      {/* ── Sticky bottom bar ─────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-xl px-4 py-3">
        <div className="max-w-xl mx-auto">
          {cartItems.length > 0 ? (
            <div className="space-y-2">
              {/* Item chips */}
              <div className="flex flex-wrap gap-1.5">
                {cartItems.map(i => (
                  <span key={i._id} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                    {i.name} ×{i.qty}
                    <span className="ml-1 text-gray-400">{i.subtotal.toFixed(0)}</span>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs text-gray-400 leading-none">Total</p>
                  <p className="text-2xl font-extrabold text-gray-900 leading-tight">
                    {total.toFixed(2)} <span className="text-sm font-normal text-gray-400">AED</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={submit}
                  disabled={loading || !selectedCustomer}
                  className="ml-auto flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <FiShoppingCart size={16} />
                  {loading ? "Saving…" : "Create Order"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {selectedCustomer ? "Tap items above to add" : "Select a customer first"}
              </p>
              <button
                disabled
                className="px-5 py-2.5 bg-gray-100 text-gray-400 font-semibold rounded-xl text-sm cursor-not-allowed"
              >
                Create Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
