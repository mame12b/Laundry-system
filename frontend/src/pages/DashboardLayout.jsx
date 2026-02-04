import { Link, Outlet, useNavigate } from "react-router-dom";
import { FiHome, FiPackage, FiDollarSign, FiBarChart2, FiLogOut } from "react-icons/fi";
import { canAccess, normalizeRole } from "../utils/permissions";

export default function DashboardLayout({ user, setUser }) {
  const navigate = useNavigate();
  const role =normalizeRole(user?.role);

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login", { replace: true});
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-blue-600">Laundry System</h1>
        </div>

        <nav className="p-4 space-y-2">
          <NavItem to="/" label="Home" icon={<FiHome />} />

          {canAccess.dashboard(role) && (
          <NavItem to="/dashboard" label="Dashboard" icon={<FiBarChart2 />} />

          )}
          <NavItem to="/orders" label="Orders" icon={<FiPackage />} />

          {canAccess.payments(role) && (
          <NavItem to="/payments" label="Payments" icon={<FiDollarSign />} />
          )}

          {canAccess.reports(role ) && (
          <NavItem to="/reports" label="Reports" icon={<FiBarChart2 />} />

           )}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-red-500 hover:text-red-700"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>


      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Welcome</p>
            <h2 className="text-lg font-semibold">{user.name}</h2>
          </div>
          <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            {user.role}
          </span>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, label, icon }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 text-gray-700"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
