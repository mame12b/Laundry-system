import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { FiHome, FiPackage, FiDollarSign, FiBarChart2, FiLogOut, FiMenu, FiX, FiTag, FiUsers, FiUserCheck, FiFileText, FiGrid } from "react-icons/fi";
import { canAccess, normalizeRole } from "../utils/permissions";
import { useLanguage } from "../context/LanguageContext";

export default function DashboardLayout({ user, setUser }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const { t, isRTL, toggleLang } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const role = useMemo(() => normalizeRole(user?.role), [user?.role]);

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b">
        <div className="flex items-center justify-between px-3 py-2 gap-2">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 flex-shrink-0" aria-label={t("open_menu")}>
            <FiMenu size={20} />
          </button>
          <div className="text-center flex-1 min-w-0">
            <div className="text-xs text-gray-500">{t("welcome")}</div>
            <div className="font-semibold text-sm leading-5 truncate">{user?.name}</div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={toggleLang}
              className="text-xs font-semibold bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-2 py-1 rounded-lg transition"
            >
              {t("lang_toggle")}
            </button>
            <button
              onClick={logout}
              className="text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-lg transition"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:min-h-screen bg-white shadow-lg">
          <SidebarContent role={role} pathname={pathname} onLogout={logout} user={user} onNavigate={() => {}} t={t} toggleLang={toggleLang} />
        </aside>

        {/* Mobile drawer */}
        {open && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setOpen(false)} />
            <aside className={`fixed z-50 inset-y-0 ${isRTL ? "right-0" : "left-0"} w-72 bg-white shadow-2xl`}>
              <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-lg font-bold text-blue-600">{t("app_name")}</h1>
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-gray-100" aria-label={t("close")}>
                  <FiX size={20} />
                </button>
              </div>
              <SidebarContent role={role} pathname={pathname} onLogout={logout} user={user} onNavigate={() => setOpen(false)} t={t} toggleLang={toggleLang} />
            </aside>
          </>
        )}

        {/* Main */}
        <div className="flex-1 min-w-0">
          <header className="hidden md:flex bg-white shadow px-6 py-4 justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">{t("welcome_back")}</p>
              <h2 className="text-lg font-semibold">{user?.name}</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLang}
                className="text-sm font-semibold bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-3 py-1.5 rounded-lg transition"
              >
                {t("lang_toggle")}
              </button>
              <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{user?.role}</span>
            </div>
          </header>
          <main className="p-4 sm:p-6"><Outlet /></main>
          <footer className="bg-white border-t mt-4 py-4 px-4 text-center">
            <p className="text-xs font-semibold text-gray-500">{t("app_name")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t("footer_tagline")}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ role, pathname, onLogout, user, onNavigate, t, toggleLang }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="hidden md:block p-6 border-b">
        <h1 className="text-xl font-bold text-blue-600">{t("app_name")}</h1>
        <p className="text-xs text-gray-400 mt-1">{user?.name}</p>
      </div>

      <nav className="p-4 space-y-1">
        <NavItem to="/" label={t("nav_home")} icon={<FiHome />} pathname={pathname} onNavigate={onNavigate} exact />

        {canAccess.dashboard(role) && (
          <NavItem to="/dashboard" label={t("nav_dashboard")} icon={<FiBarChart2 />} pathname={pathname} onNavigate={onNavigate} />
        )}

        <NavItem to="/orders" label={t("nav_orders")} icon={<FiPackage />} pathname={pathname} onNavigate={onNavigate} />

        {canAccess.customers(role) && (
          <NavItem to="/customers" label={t("nav_customers")} icon={<FiUsers />} pathname={pathname} onNavigate={onNavigate} />
        )}

        {canAccess.payments(role) && (
          <NavItem to="/payments" label={t("nav_payments")} icon={<FiDollarSign />} pathname={pathname} onNavigate={onNavigate} />
        )}

        {canAccess.invoices(role) && (
          <NavItem to="/invoices" label={t("nav_invoices")} icon={<FiFileText />} pathname={pathname} onNavigate={onNavigate} />
        )}

        {canAccess.prices(role) && (
          <NavItem to="/prices" label={t("nav_prices")} icon={<FiTag />} pathname={pathname} onNavigate={onNavigate} />
        )}

        {canAccess.users(role) && (
          <NavItem to="/users" label={t("nav_staff")} icon={<FiUserCheck />} pathname={pathname} onNavigate={onNavigate} />
        )}

        {canAccess.dailyOrders(role) && (
          <NavItem to="/daily-orders" label={t("daily_orders")} icon={<FiGrid />} pathname={pathname} onNavigate={onNavigate} />
        )}

        {canAccess.reports(role) && (
          <NavItem to="/reports" label={t("nav_reports")} icon={<FiBarChart2 />} pathname={pathname} onNavigate={onNavigate} />
        )}
      </nav>

      <div className="mt-auto p-4 border-t space-y-2">
        <button
          onClick={toggleLang}
          className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 w-full"
        >
          🌐 {t("lang_toggle")}
        </button>
        <button onClick={onLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm">
          <FiLogOut /> {t("logout")}
        </button>
      </div>
    </div>
  );
}

function NavItem({ to, label, icon, pathname, onNavigate, exact = false }) {
  const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  return (
    <Link to={to} onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm
        ${active ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}>
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
