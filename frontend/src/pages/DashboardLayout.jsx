import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { FiHome, FiPackage, FiDollarSign, FiBarChart2, FiLogOut, FiMenu, FiX, FiTag, FiUsers, FiUserCheck, FiFileText } from "react-icons/fi";
import { canAccess, normalizeRole } from "../utils/permissions";

export default function DashboardLayout({ user, setUser }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

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
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Open menu">
            <FiMenu size={20} />
          </button>
          <div className="text-center">
            <div className="text-xs text-gray-500">Welcome</div>
            <div className="font-semibold text-sm leading-5">{user?.name}</div>
          </div>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{user?.role}</span>
        </div>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:min-h-screen bg-white shadow-lg">
          <SidebarContent role={role} pathname={pathname} onLogout={logout} user={user} onNavigate={() => {}} />
        </aside>

        {/* Mobile drawer */}
        {open && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setOpen(false)} />
            <aside className="fixed z-50 inset-y-0 left-0 w-72 bg-white shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-lg font-bold text-blue-600">Laundry System</h1>
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
                  <FiX size={20} />
                </button>
              </div>
              <SidebarContent role={role} pathname={pathname} onLogout={logout} user={user} onNavigate={() => setOpen(false)} />
            </aside>
          </>
        )}

        {/* Main */}
        <div className="flex-1 min-w-0">
          <header className="hidden md:flex bg-white shadow px-6 py-4 justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Welcome back</p>
              <h2 className="text-lg font-semibold">{user?.name}</h2>
            </div>
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{user?.role}</span>
          </header>
          <main className="p-4 sm:p-6"><Outlet /></main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ role, pathname, onLogout, user, onNavigate }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="hidden md:block p-6 border-b">
        <h1 className="text-xl font-bold text-blue-600">Laundry System</h1>
        <p className="text-xs text-gray-400 mt-1">{user?.name}</p>
      </div>

      <nav className="p-4 space-y-1">
        <NavItem to="/" label="Home" icon={<FiHome />} pathname={pathname} onNavigate={onNavigate} exact />

        {canAccess.dashboard(role) && (
          <NavItem to="/dashboard" label="Dashboard" icon={<FiBarChart2 />} pathname={pathname} onNavigate={onNavigate} />
        )}

        <NavItem to="/orders" label="Orders" icon={<FiPackage />} pathname={pathname} onNavigate={onNavigate} />

        {canAccess.customers(role) && (
          <NavItem to="/customers" label="Customers" icon={<FiUsers />} pathname={pathname} onNavigate={onNavigate} />
        )}

        {canAccess.payments(role) && (
          <NavItem to="/payments" label="Payments" icon={<FiDollarSign />} pathname={pathname} onNavigate={onNavigate} />
        )}

        {canAccess.invoices(role) && (
          <NavItem to="/invoices" label="Invoices" icon={<FiFileText />} pathname={pathname} onNavigate={onNavigate} />
        )}

        {canAccess.prices(role) && (
          <NavItem to="/prices" label="Price List" icon={<FiTag />} pathname={pathname} onNavigate={onNavigate} />
        )}

        {canAccess.users(role) && (
          <NavItem to="/users" label="Staff" icon={<FiUserCheck />} pathname={pathname} onNavigate={onNavigate} />
        )}

        {canAccess.reports(role) && (
          <NavItem to="/reports" label="Reports" icon={<FiBarChart2 />} pathname={pathname} onNavigate={onNavigate} />
        )}
      </nav>

      <div className="mt-auto p-4 border-t">
        <button onClick={onLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm">
          <FiLogOut /> Logout
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