import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

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

import RequireRole from "./components/RequireRole";
import { canAccess } from "./utils/permissions";

function Protected({ user }) {
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route element={<Protected user={user} />}>
        <Route element={<DashboardLayout user={user} setUser={setUser} />}>
          <Route index element={<Home user={user} />} />
          <Route path="dashboard" element={<Dashboard user={user} />} />
          <Route path="orders" element={<Orders user={user} />} />
          <Route path= "orders/new" element= {<CreateOrder user={user} />} />

          <Route
            path="payments"
            element={
              <RequireRole user={user} allow={(role) => canAccess.payments(role)}>
                <Payments user={user} />
              </RequireRole>
            }
          />

          <Route
            path="reports"
            element={
              <RequireRole user={user} allow={(role) => canAccess.reports(role)}>
                <Reports user={user} />
              </RequireRole>
            }
          />
          <Route
  path="orders/new"
  element={
    <RequireRole user={user} allow={(role) => ["Collector","Manager"].includes(role)}>
      <CreateOrder user={user} />
    </RequireRole>
  }
/>
          <Route path="orders/:id" element={<OrderDetails user={user} />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
    

  );
}
