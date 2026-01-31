import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import OrderDetails from "./pages/OrderDetails";
import RequireRole from "./components/RequireRole";
import { canAccess } from "./utils/permissions";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  if (!user) return <Login setUser={setUser} />;

  return (
      <Routes>
        <Route element={<DashboardLayout user={user} setUser={setUser} />}>
          <Route index element={<Home user={user} />} />
           <Route path="dashboard" element={<Dashboard />} />  
          <Route path="orders" element={<Orders user={user} />} />
          <Route path="payments" 
          element={
           <RequireRole user={user} allow={(role) => canAccess.payments(role)}>
                <Payments />
           </RequireRole>
          } />
          <Route path="reports"
           element={
            <RequireRole user={user} allow={(role) => canAccess.reports(role)}>
           <Reports />
           </RequireRole>
          } />
          <Route path="orders/:id" element={<OrderDetails />} />
        </Route>
      </Routes>
  );
}
