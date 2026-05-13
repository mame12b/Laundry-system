import { useEffect, useState } from "react";
import { API, apiFetch } from "../api";
import Toast from "../components/Toast";
import { useLanguage } from "../context/LanguageContext";

export default function Invoices() {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ customer: "", month: new Date().toISOString().slice(0, 7) });
  const [toast, setToast] = useState({ type: "", message: "" });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, iRes] = await Promise.all([
        apiFetch(`${API}/customers`),
        apiFetch(`${API}/invoices`),
      ]);
      const [cData, iData] = await Promise.all([cRes.json(), iRes.json()]);
      setCustomers(Array.isArray(cData) ? cData : []);
      setInvoices(Array.isArray(iData) ? iData : []);
    } catch {
      showToast("error", t("failed_load_data"));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  const generate = async (e) => {
    e.preventDefault();
    if (!form.customer || !form.month) return showToast("error", t("err_select_customer"));
    try {
      setSubmitting(true);
      const res = await apiFetch(`${API}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to generate invoice");
      showToast("success", t("generate_invoice"));
      setForm(p => ({ ...p, customer: "" }));
      loadData();
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPdf = async (invoiceId) => {
    try {
      const res = await apiFetch(`${API}/invoices/${invoiceId}/pdf`);
      if (!res.ok) {
        const msg = await res.text();
        showToast("error", msg || "Failed to download PDF");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast("error", "Network error downloading PDF");
    }
  };

  return (
    <div className="space-y-6">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "", message: "" })} />

      <div>
        <h1 className="text-2xl font-bold">{t("invoices_title")}</h1>
        <p className="text-sm text-gray-500">{t("invoices_sub")}</p>
      </div>

      {/* Generate form */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold mb-4">{t("generate_invoice")}</h2>
        <form onSubmit={generate} className="flex flex-col sm:flex-row gap-3">
          <select value={form.customer} onChange={e => setForm(p => ({ ...p, customer: e.target.value }))}
            className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">{t("select_customer_placeholder")}</option>
            {customers.map(c => (
              <option key={c._id} value={c._id}>{c.name} ({c.type})</option>
            ))}
          </select>
          <input type="month" value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm" />
          <button type="submit" disabled={submitting} className={`btn-primary whitespace-nowrap ${submitting ? "opacity-60" : ""}`}>
            {submitting ? t("generating") : t("generate_btn")}
          </button>
        </form>
      </div>

      {/* Invoices list */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b"><h2 className="font-semibold">{t("generated_invoices")}</h2></div>
        {loading ? (
          <p className="p-4 text-sm text-gray-500">{t("loading")}</p>
        ) : invoices.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">{t("no_invoices")}</p>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="sm:hidden divide-y divide-gray-100">
              {invoices.map(inv => {
                const balance = Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0);
                return (
                  <div key={inv._id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{inv.customer?.name || inv.customer}</p>
                        <p className="text-xs text-gray-500">{inv.month}</p>
                      </div>
                      <button
                        onClick={() => downloadPdf(inv._id)}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 whitespace-nowrap"
                      >
                        {t("download_pdf")}
                      </button>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-gray-500">{t("inv_total")}: <span className="text-gray-900 font-medium">{Number(inv.totalAmount).toFixed(2)}</span></span>
                      <span className="text-gray-500">{t("inv_paid")}: <span className="text-green-700 font-medium">{Number(inv.paidAmount).toFixed(2)}</span></span>
                      <span className="text-gray-500">{t("inv_balance")}: <span className={`font-semibold ${balance > 0 ? "text-red-600" : "text-green-700"}`}>{balance.toFixed(2)}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table layout */}
            <table className="hidden sm:table w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">{t("inv_customer")}</th>
                  <th className="text-left px-4 py-3">{t("inv_month")}</th>
                  <th className="text-right px-4 py-3">{t("inv_total")}</th>
                  <th className="text-right px-4 py-3">{t("inv_paid")}</th>
                  <th className="text-right px-4 py-3">{t("inv_balance")}</th>
                  <th className="text-right px-4 py-3">{t("inv_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map(inv => {
                  const balance = Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0);
                  return (
                    <tr key={inv._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{inv.customer?.name || inv.customer}</td>
                      <td className="px-4 py-3 text-gray-500">{inv.month}</td>
                      <td className="px-4 py-3 text-right">{Number(inv.totalAmount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-green-700">{Number(inv.paidAmount).toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${balance > 0 ? "text-red-600" : "text-green-700"}`}>
                        {balance.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => downloadPdf(inv._id)} className="text-blue-600 hover:underline text-xs">
                          {t("download_pdf")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
