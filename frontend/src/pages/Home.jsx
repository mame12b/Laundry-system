import { Link } from "react-router-dom";
import {
  FiBarChart2, FiPackage, FiDollarSign, FiPlusCircle,
  FiFileText, FiTag, FiUsers, FiUserCheck, FiArrowRight, FiGrid,
} from "react-icons/fi";
import { canAccess, normalizeRole } from "../utils/permissions";
import { useLanguage } from "../context/LanguageContext";

export default function Home({ user }) {
  const { t } = useLanguage();
  const role    = normalizeRole(user?.role);

  const ACTION_CARDS = [
    {
      to: "/dashboard",
      labelKey: "card_dashboard",
      descKey: "card_dashboard_desc",
      icon: <FiBarChart2 size={22} />,
      roles: r => canAccess.dashboard(r),
      color: "from-blue-500 to-indigo-600",
      featured: true,
    },
    {
      to: "/orders",
      labelKey: "card_orders",
      descKey: "card_orders_desc",
      icon: <FiPackage size={22} />,
      roles: () => true,
      color: "from-slate-600 to-slate-700",
      featured: false,
    },
    {
      to: "/orders/new",
      labelKey: "card_create_order",
      descKey: "card_create_order_desc",
      icon: <FiPlusCircle size={22} />,
      roles: r => ["COLLECTOR", "MANAGER"].includes(r),
      color: "from-blue-500 to-blue-600",
      featured: false,
    },
    {
      to: "/customers",
      labelKey: "card_customers",
      descKey: "card_customers_desc",
      icon: <FiUsers size={22} />,
      roles: r => canAccess.customers(r),
      color: "from-purple-500 to-purple-600",
      featured: false,
    },
    {
      to: "/payments",
      labelKey: "card_payments",
      descKey: "card_payments_desc",
      icon: <FiDollarSign size={22} />,
      roles: r => canAccess.payments(r),
      color: "from-green-500 to-emerald-600",
      featured: false,
    },
    {
      to: "/invoices",
      labelKey: "card_invoices",
      descKey: "card_invoices_desc",
      icon: <FiFileText size={22} />,
      roles: r => canAccess.invoices(r),
      color: "from-teal-500 to-teal-600",
      featured: false,
    },
    {
      to: "/prices",
      labelKey: "card_prices",
      descKey: "card_prices_desc",
      icon: <FiTag size={22} />,
      roles: r => canAccess.prices(r),
      color: "from-amber-500 to-orange-500",
      featured: false,
    },
    {
      to: "/users",
      labelKey: "card_staff",
      descKey: "card_staff_desc",
      icon: <FiUserCheck size={22} />,
      roles: r => canAccess.users(r),
      color: "from-rose-500 to-pink-600",
      featured: false,
    },
    {
      to: "/daily-orders",
      labelKey: "daily_orders",
      descKey: "daily_orders_sub",
      icon: <FiGrid size={22} />,
      roles: r => canAccess.dailyOrders(r),
      color: "from-cyan-500 to-teal-600",
      featured: false,
    },
    {
      to: "/reports",
      labelKey: "card_reports",
      descKey: "card_reports_desc",
      icon: <FiBarChart2 size={22} />,
      roles: r => canAccess.reports(r),
      color: "from-violet-500 to-purple-600",
      featured: false,
    },
  ];

  const visible   = ACTION_CARDS.filter(c => c.roles(role));
  const featured  = visible.filter(c => c.featured);
  const secondary = visible.filter(c => !c.featured);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-blue-200 text-sm font-medium">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              {t("welcome")}, <span className="text-blue-200">{user?.name}</span>
            </h1>
            <p className="text-blue-100 text-sm mt-1">{t("home_today")}</p>
          </div>
          <span className="self-start sm:self-auto bg-white/20 border border-white/30 text-white text-sm font-semibold px-4 py-2 rounded-full">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Featured cards */}
      {featured.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {featured.map(card => (
            <Link key={card.to} to={card.to}
              className={`bg-gradient-to-br ${card.color} text-white rounded-2xl p-5 flex items-center justify-between shadow hover:shadow-lg transition hover:-translate-y-0.5 group`}>
              <div>
                <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-3">{card.icon}</div>
                <p className="font-bold text-lg">{t(card.labelKey)}</p>
                <p className="text-sm text-white/80 mt-0.5">{t(card.descKey)}</p>
              </div>
              <FiArrowRight size={20} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition" />
            </Link>
          ))}
        </div>
      )}

      {/* Secondary cards */}
      {secondary.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t("home_quick_access")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {secondary.map(card => (
              <Link key={card.to} to={card.to}
                className="bg-white rounded-xl shadow p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition group border border-transparent hover:border-gray-200">
                <div className={`bg-gradient-to-br ${card.color} text-white p-2.5 rounded-xl w-fit`}>
                  {card.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t(card.labelKey)}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{t(card.descKey)}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-blue-600 transition mt-auto">
                  {t("home_open")} <FiArrowRight size={11} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
