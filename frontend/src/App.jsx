import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useState  } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import OrderDetails from "./pages/OrderDetails";
import CreateOrder from "./pages/CreateOrder";
import PriceManagement from "./pages/PriceManagement";
import CustomerManagement from "./pages/CustomerManagement";
import UserManagement from "./pages/UserManagement";
import Invoices from "./pages/Invoices";

import RequireRole from "./components/RequireRole";
import { canAccess } from "./utils/permissions";

function Protected({ user }) {
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
    const [user, setUser] = useState(() => {
      try {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    });

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login setUser={setUser} />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      <Route element={<Protected user={user} />}>
        <Route element={<DashboardLayout user={user} setUser={setUser} />}>
          <Route index element={<Home user={user} />} />
          <Route path="dashboard" element={<Dashboard user={user} />} />
          <Route path="orders" element={<Orders user={user} />} />
          <Route path="orders/:id" element={<OrderDetails user={user} />} />
          <Route path="orders/new" element={
            <RequireRole user={user} allow={r => ["COLLECTOR","MANAGER"].includes(r)}>
              <CreateOrder user={user} />
            </RequireRole>
          } />
          <Route path="payments" element={
            <RequireRole user={user} allow={r => canAccess.payments(r)}>
              <Payments />
            </RequireRole>
          } />
          <Route path="reports" element={
            <RequireRole user={user} allow={r => canAccess.reports(r)}>
              <Reports />
            </RequireRole>
          } />
          <Route path="prices" element={
            <RequireRole user={user} allow={r => canAccess.prices(r)}>
              <PriceManagement />
            </RequireRole>
          } />
          <Route path="customers" element={
            <RequireRole user={user} allow={r => canAccess.customers(r)}>
              <CustomerManagement user={user} />
            </RequireRole>
          } />
          <Route path="users" element={
            <RequireRole user={user} allow={r => canAccess.users(r)}>
              <UserManagement />
            </RequireRole>
          } />
          <Route path="invoices" element={
            <RequireRole user={user} allow={r => canAccess.invoices(r)}>
              <Invoices />
            </RequireRole>
          } />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}