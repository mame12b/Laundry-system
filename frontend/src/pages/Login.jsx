import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API } from "../api.js";
import { FiPhone, FiLock, FiArrowRight, FiShield } from "react-icons/fi";
import { useLanguage } from "../context/LanguageContext";

export default function Login({ setUser }) {
  const navigate = useNavigate();
  const { t, toggleLang } = useLanguage();

  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const redirectByRole = (role) => {
    const r = (role || "").toUpperCase();
    if (r === "MANAGER") return "/dashboard";
    if (r === "CASHIER") return "/payments";
    return "/orders";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid phone or PIN");
        return;
      }

      const savedUser = { ...data.user, token: data.token };
      localStorage.setItem("user", JSON.stringify(savedUser));
      setUser(savedUser);
      navigate(redirectByRole(savedUser.role), { replace: true });
    } catch {
      setError(t("login_error_network"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <FiShield size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t("app_name")}</h1>
          <p className="text-slate-400 text-sm mt-1">{t("login_title")}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-900">{t("login_welcome")}</h2>
            <button
              onClick={toggleLang}
              className="text-xs font-semibold bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 px-2 py-1 rounded-lg transition"
            >
              🌐 {t("lang_toggle")}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-0.5 mb-5">{t("login_subtitle")}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t("login_phone")}</label>
              <div className="relative mt-1">
                <FiPhone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder={t("login_phone_placeholder")}
                  required
                  autoComplete="tel"
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">{t("login_pin")}</label>
              <div className="relative mt-1">
                <FiLock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t("login_pin_placeholder")}
                  required
                  autoComplete="current-password"
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{t("login_pin_hint")}</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-semibold transition flex items-center justify-center gap-2 ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              }`}
            >
              {loading ? t("login_loading") : <> {t("login_btn")} <FiArrowRight size={16} /> </>}
            </button>
          </form>

          <div className="text-center mt-5 text-sm text-gray-500">
            {t("login_no_account")}{" "}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              {t("login_get_access")}
            </Link>
          </div>
        </div>

        <p className="text-slate-500 text-xs text-center mt-4">
          © {new Date().getFullYear()} {t("app_name")}
        </p>
      </div>
    </div>
  );
}
