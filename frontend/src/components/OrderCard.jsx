/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useState } from "react";
import { API, apiFetch } from "../api";
import { FiChevronDown, FiChevronUp, FiEdit2, FiX, FiPlus, FiMinus, FiSave } from "react-icons/fi";
import { useLanguage } from "../context/LanguageContext";

const nextStatusMap = {
  PICKED: "RECEIVED",
  RECEIVED: "WASHING",
  WASHING: "IRONING",
  IRONING: "READY",
  READY: "DELIVERED",
};

const roleAllowedNext = {
  COLLECTOR: "RECEIVED",
  WASHER: "WASHING",
  SORTER: "IRONING",
  IRONER: "READY",
  DRIVER: "DELIVERED",
  MANAGER: "*",
};

export default function OrderCard({ order, user, onUpdated, onToast }) {
  const { t } = useLanguage();
  const [updating, setUpdating]   = useState(false);
  const [staff, setStaff]         = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [expanded, setExpanded]   = useState(false);

  // edit mode
  const [editMode, setEditMode]   = useState(false);
  const [editCart, setEditCart]   = useState({}); // { priceItemId: { qty, price, name, unit } }
  const [prices, setPrices]       = useState([]);
  const [saving, setSaving]       = useState(false);

  const role      = (user?.role || "").toUpperCase();
  const isManager = role === "MANAGER";
  const canEdit   = (isManager || role === "COLLECTOR") && order.status === "PICKED";

  /* ── load staff (manager only) ── */
  useEffect(() => {
    if (!isManager) return;
    apiFetch(`${API}/users/staff`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setStaff(d); })
      .catch(() => {});
  }, [isManager]);

  /* ── open edit mode: seed cart from current items & fetch price list ── */
  const openEdit = async () => {
    const seed = {};
    (order.items || []).forEach(i => {
      const id   = typeof i.item === "object" ? i.item?._id : i.item;
      const name = typeof i.item === "object" ? i.item?.name : "?";
      const unit = typeof i.item === "object" ? i.item?.unit : "pc";
      if (id) seed[id] = { qty: i.qty, price: i.price, name, unit };
    });
    setEditCart(seed);

    if (prices.length === 0) {
      try {
        const res  = await apiFetch(`${API}/prices`);
        const data = await res.json().catch(() => []);
        if (res.ok) setPrices(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
    }
    setEditMode(true);
    setExpanded(true);
  };

  const cancelEdit = () => setEditMode(false);

  const changeQty = (id, delta) => {
    setEditCart(prev => {
      const item = prev[id];
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...item, qty: newQty } };
    });
  };

  const addPriceItem = (p) => {
    setEditCart(prev => ({
      ...prev,
      [p._id]: prev[p._id]
        ? { ...prev[p._id], qty: prev[p._id].qty + 1 }
        : { qty: 1, price: p.pricePerUnit, name: p.name, unit: p.unit },
    }));
  };

  const saveEdit = async () => {
    const items = Object.entries(editCart).map(([id, v]) => ({
      item: id, qty: v.qty, price: v.price,
    }));
    if (items.length === 0) {
      onToast?.("error", t("err_add_item"));
      return;
    }
    try {
      setSaving(true);
      const res  = await apiFetch(`${API}/orders/${order._id}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = safeJson(await res.text());
      if (!res.ok) throw new Error(data?.message || "Failed to save");
      onToast?.("success", "Order updated");
      setEditMode(false);
      await onUpdated?.();
    } catch (e) {
      onToast?.("error", e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  /* ── status update ── */
  const nextStatus = nextStatusMap[order.status];
  const canUpdate  = useMemo(() => {
    if (!nextStatus || !role) return false;
    if (role === "MANAGER") return true;
    return roleAllowedNext[role] === nextStatus;
  }, [role, nextStatus]);

  const updateStatus = async () => {
    if (!nextStatus || updating) return;
    try {
      setUpdating(true);
      const res  = await apiFetch(`${API}/orders/${order._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = safeJson(await res.text());
      if (!res.ok) throw new Error(data?.message || "Failed to update status");
      onToast?.("success", `Order updated to ${nextStatus}`);
      await onUpdated?.();
    } catch (e) {
      onToast?.("error", e.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  /* ── assign ── */
  const assign = async (userId) => {
    if (!userId) return;
    try {
      setAssigning(true);
      const res  = await apiFetch(`${API}/orders/${order._id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = safeJson(await res.text());
      if (!res.ok) throw new Error(data?.message || "Assign failed");
      onToast?.("success", "Order assigned");
      await onUpdated?.();
    } catch (e) {
      onToast?.("error", e.message || "Assign failed");
    } finally {
      setAssigning(false);
    }
  };

  const outstanding = Math.max(
    Number(order.totalAmount || 0) - Number(order.paidAmount || 0), 0
  );

  const items     = order.items || [];
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : null;

  // prices not yet in cart (for "add item" picker)
  const addablePrices = prices.filter(p => !editCart[p._id]);

  const editTotal = Object.values(editCart).reduce((s, v) => s + v.qty * v.price, 0);

  return (
    <div className="bg-white rounded-2xl shadow p-4">

      {/* ── HEADER (tappable summary) ── */}
      <button className="w-full text-left" onClick={() => !editMode && setExpanded(v => !v)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {t("card_customer")}: {order.customer?.name || "—"}
            </p>
            <p className="text-xs text-gray-500">
              {t("card_status")}: {t(`status_${order.status}`)} • #{order._id?.slice(-6)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t("card_assigned")}:{" "}
              <b>
                {order.assignedTo?.name
                  ? `${order.assignedTo.name} (${order.assignedTo.role})`
                  : t("card_not_assigned")}
              </b>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <StatusBadge status={order.status} t={t} />
            {!editMode && (
              <span className="text-gray-400">
                {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </span>
            )}
          </div>
        </div>

        <div className="text-sm flex flex-wrap gap-3 mt-3">
          <span>{t("card_total")}: {order.totalAmount}</span>
          <span>{t("card_paid")}: {order.paidAmount}</span>
          <span className={outstanding > 0 ? "text-red-600" : "text-green-700"}>
            {t("card_due")}: {outstanding}
          </span>
        </div>
      </button>

      {/* ── EXPANDED DETAILS ── */}
      {expanded && !editMode && (
        <div className="mt-3 border-t border-gray-100 pt-3 space-y-3">

          {/* Customer info */}
          {order.customer && (
            <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
              <p className="font-semibold text-gray-700 mb-1">{t("card_customer_info")}</p>
              <p><span className="text-gray-500">{t("card_name")}:</span> {order.customer.name}</p>
              {order.customer.phone   && <p><span className="text-gray-500">{t("card_phone")}:</span>   {order.customer.phone}</p>}
              {order.customer.type    && <p><span className="text-gray-500">{t("card_type")}:</span>    {order.customer.type}</p>}
              {order.customer.address && <p><span className="text-gray-500">{t("card_address")}:</span> {order.customer.address}</p>}
            </div>
          )}

          {/* Items list + edit button */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-700">{t("card_order_items")}</p>
              {canEdit && (
                <button
                  onClick={openEdit}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded-lg hover:bg-blue-50 transition"
                >
                  <FiEdit2 size={12} /> Edit items
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-gray-400">{t("card_no_items")}</p>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {items.map((i, idx) => {
                  const itemObj = i?.item;
                  const name    = (itemObj && typeof itemObj === "object" ? itemObj.name : itemObj) || `Item ${idx + 1}`;
                  const unit    = itemObj?.unit || "pc";
                  const qty     = Number(i?.qty  || 0);
                  const price   = Number(i?.price || 0);
                  return (
                    <div key={i._id || idx} className="flex items-center justify-between px-3 py-2 text-xs">
                      <div>
                        <span className="font-medium text-gray-900">{name}</span>
                        <span className="text-gray-400 ml-1">({unit})</span>
                      </div>
                      <div className="text-right text-gray-600">
                        <span>{qty} × {price}</span>
                        <span className="ml-2 font-semibold text-gray-900">= {(qty * price).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between px-3 py-2 bg-gray-50 text-xs font-bold">
                  <span>{t("card_total")}</span>
                  <span>{Number(order.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="text-xs text-gray-400 space-y-0.5">
            {order.collectedBy?.name && (
              <p>{t("card_collected_by")}: <span className="text-gray-600 font-medium">{order.collectedBy.name}</span></p>
            )}
            {createdAt && <p>{t("card_created")}: {createdAt}</p>}
          </div>
        </div>
      )}

      {/* ── EDIT MODE ── */}
      {editMode && (
        <div className="mt-3 border-t border-blue-100 pt-3 space-y-4">

          {/* Edit header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-700">Edit Order Items</p>
            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 p-1">
              <FiX size={16} />
            </button>
          </div>

          {/* Current items with +/- controls */}
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {Object.entries(editCart).length === 0 && (
              <p className="px-3 py-4 text-xs text-gray-400 text-center">{t("card_no_items")}</p>
            )}
            {Object.entries(editCart).map(([id, v]) => (
              <div key={id} className="flex items-center justify-between px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900">{v.name}</p>
                  <p className="text-xs text-gray-400">{v.price} / {v.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeQty(id, -1)}
                    className="w-7 h-7 rounded-full border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 transition"
                  >
                    <FiMinus size={11} />
                  </button>
                  <span className="text-sm font-bold text-gray-900 w-6 text-center">{v.qty}</span>
                  <button
                    onClick={() => changeQty(id, 1)}
                    className="w-7 h-7 rounded-full border border-blue-200 text-blue-600 flex items-center justify-center hover:bg-blue-50 transition"
                  >
                    <FiPlus size={11} />
                  </button>
                  <span className="text-xs font-semibold text-gray-700 w-14 text-right">
                    = {(v.qty * v.price).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
            {/* Running total */}
            {Object.keys(editCart).length > 0 && (
              <div className="flex justify-between px-3 py-2 bg-blue-50 text-xs font-bold">
                <span className="text-blue-700">{t("card_total")}</span>
                <span className="text-blue-700">{editTotal.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Add items from price list */}
          {addablePrices.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Add item</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {addablePrices.map(p => (
                  <button
                    key={p._id}
                    onClick={() => addPriceItem(p)}
                    className="flex items-center justify-between border border-dashed border-gray-300 rounded-xl px-3 py-2 hover:border-blue-400 hover:bg-blue-50 transition text-left"
                  >
                    <div>
                      <p className="text-xs font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-blue-600">{p.pricePerUnit}/{p.unit}</p>
                    </div>
                    <FiPlus size={14} className="text-blue-500 flex-shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save / Cancel */}
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={saving || Object.keys(editCart).length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
            >
              <FiSave size={14} />
              {saving ? t("saving") : "Save changes"}
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* ── MANAGER ASSIGN ── */}
      {isManager && (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <select
            className="w-full sm:w-auto border rounded-lg px-3 py-2 text-sm"
            defaultValue=""
            onChange={(e) => assign(e.target.value)}
            disabled={assigning}
          >
            <option value="" disabled>
              {assigning ? t("card_assigning") : t("card_assign_staff")}
            </option>
            {staff.map((u) => (
              <option key={u._id} value={u._id}>{u.name} — {u.role}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400 self-center">{t("card_tip_assign")}</span>
        </div>
      )}

      {/* ── STATUS BUTTON ── */}
      {canUpdate && (
        <button
          className={`mt-3 w-full sm:w-auto px-4 py-2 rounded-lg text-white font-semibold ${
            updating ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
          onClick={updateStatus}
          disabled={updating}
        >
          {updating ? t("card_updating") : `${t("card_mark_as")} ${t(`status_${nextStatus}`)}`}
        </button>
      )}

      {/* INFO MESSAGE */}
      {!canUpdate && nextStatus && role !== "MANAGER" && (
        <p className="mt-3 text-xs text-gray-400">
          {t("card_next_step")}: <b>{t(`status_${nextStatus}`)}</b> ({t("card_restricted")})
        </p>
      )}

      {/* HIDE DETAILS */}
      {expanded && !editMode && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-3 text-xs text-blue-500 hover:underline w-full text-center"
        >
          {t("card_hide_details")}
        </button>
      )}
    </div>
  );
}

/* ── helpers ── */

function StatusBadge({ status, t }) {
  const s   = (status || "").toUpperCase();
  const cls =
    s === "DELIVERED" ? "bg-green-100 text-green-800" :
    s === "READY"     ? "bg-blue-100 text-blue-800"   :
    s === "IRONING"   ? "bg-purple-100 text-purple-800":
    s === "WASHING"   ? "bg-yellow-100 text-yellow-800":
    s === "RECEIVED"  ? "bg-orange-100 text-orange-800":
                        "bg-gray-100 text-gray-800";
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${cls}`}>
      {t(`status_${s}`)}
    </span>
  );
}

function safeJson(text) {
  try { return text ? JSON.parse(text) : {}; }
  catch { return { message: text }; }
}
