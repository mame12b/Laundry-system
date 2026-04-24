import { Link } from "react-router-dom";
import {
  FiBarChart2, FiPackage, FiDollarSign, FiPlusCircle,
  FiFileText, FiTag, FiUsers, FiUserCheck, FiArrowRight,
} from "react-icons/fi";
import { canAccess, normalizeRole } from "../utils/permissions";

const ACTION_CARDS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    desc: "Business overview & analytics",
    icon: <FiBarChart2 size={22} />,
    roles: r => canAccess.dashboard(r),
    color: "from-blue-500 to-indigo-600",
    featured: true,
  },
  {
    to: "/orders",
    label: "Orders",
    desc: "Track & update order status",
    icon: <FiPackage size={22} />,
    roles: () => true,
    color: "from-slate-600 to-slate-700",
    featured: false,
  },
  {
    to: "/orders/new",
    label: "Create Order",
    desc: "Collect items & submit",
    icon: <FiPlusCircle size={22} />,
    roles: r => ["COLLECTOR", "MANAGER"].includes(r),
    color: "from-blue-500 to-blue-600",
    featured: false,
  },
  {
    to: "/customers",
    label: "Customers",
    desc: "Manage customer accounts",
    icon: <FiUsers size={22} />,
    roles: r => canAccess.customers(r),
    color: "from-purple-500 to-purple-600",
    featured: false,
  },
  {
    to: "/payments",
    label: "Payments",
    desc: "Record & track payments",
    icon: <FiDollarSign size={22} />,
    roles: r => canAccess.payments(r),
    color: "from-green-500 to-emerald-600",
    featured: false,
  },
  {
    to: "/invoices",
    label: "Invoices",
    desc: "Monthly customer invoices",
    icon: <FiFileText size={22} />,
    roles: r => canAccess.invoices(r),
    color: "from-teal-500 to-teal-600",
    featured: false,
  },
  {
    to: "/prices",
    label: "Price List",
    desc: "Manage service prices",
    icon: <FiTag size={22} />,
    roles: r => canAccess.prices(r),
    color: "from-amber-500 to-orange-500",
    featured: false,
  },
  {
    to: "/users",
    label: "Staff",
    desc: "Manage staff accounts",
    icon: <FiUserCheck size={22} />,
    roles: r => canAccess.users(r),
    color: "from-rose-500 to-pink-600",
    featured: false,
  },
  {
    to: "/reports",
    label: "Reports",
    desc: "Revenue & performance",
    icon: <FiBarChart2 size={22} />,
    roles: r => canAccess.reports(r),
    color: "from-violet-500 to-purple-600",
    featured: false,
  },
];

export default function Home({ user }) {
  const role    = normalizeRole(user?.role);
  const visible = ACTION_CARDS.filter(c => c.roles(role));

  const featured  = visible.filter(c => c.featured);
  const secondary = visible.filter(c => !c.featured);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-blue-200 text-sm font-medium">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              Welcome, <span className="text-blue-200">{user?.name}</span>
            </h1>
            <p className="text-blue-100 text-sm mt-1">What would you like to do today?</p>
          </div>
          <span className="self-start sm:self-auto bg-white/20 border border-white/30 text-white text-sm font-semibold px-4 py-2 rounded-full">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Featured cards (Dashboard for Manager/Cashier/Collector) */}
      {featured.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {featured.map(card => (
            <Link key={card.to} to={card.to}
              className={`bg-gradient-to-br ${card.color} text-white rounded-2xl p-5 flex items-center justify-between shadow hover:shadow-lg transition hover:-translate-y-0.5 group`}>
              <div>
                <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-3">{card.icon}</div>
                <p className="font-bold text-lg">{card.label}</p>
                <p className="text-sm text-white/80 mt-0.5">{card.desc}</p>
              </div>
              <FiArrowRight size={20} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition" />
            </Link>
          ))}
        </div>
      )}

      {/* Secondary cards */}
      {secondary.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Access</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {secondary.map(card => (
              <Link key={card.to} to={card.to}
                className="bg-white rounded-xl shadow p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition group border border-transparent hover:border-gray-200">
                <div className={`bg-gradient-to-br ${card.color} text-white p-2.5 rounded-xl w-fit`}>
                  {card.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{card.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{card.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-blue-600 transition mt-auto">
                  Open <FiArrowRight size={11} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
