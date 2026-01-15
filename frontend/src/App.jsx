import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import DashboardLayout from "./pages/DashboardLayout";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import OrderDetails from "./pages/OrderDetails";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  if (!user) {
    return <Login setUser={setUser} />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout user={user} setUser={setUser} />}>
        <Route index element={<Home user={user} />} />
        <Route path="orders" element={<Orders user={user} />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="payments" element={<Payments />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
