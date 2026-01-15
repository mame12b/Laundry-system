import { Link, Outlet, useNavigate } from "react-router-dom";

export default function DashboardLayout({ user, setUser }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-60 bg-white shadow-md p-4 space-y-4">
        <h2 className="font-bold text-lg">Laundry System</h2>

        <nav className="space-y-2">
          <Link className="block hover:text-blue-600" to="/">🏠 Home</Link>
          <Link className="block hover:text-blue-600" to="/orders">📦 Orders</Link>
          <Link className="block hover:text-blue-600" to="/payments">💰 Payments</Link>
          <Link className="block hover:text-blue-600" to="/reports">📊 Reports</Link>
        </nav>

        <button
          onClick={logout}
          className="text-red-500 text-sm mt-6"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
