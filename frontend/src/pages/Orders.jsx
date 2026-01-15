import { useEffect, useState } from "react";
import { API, authHeader } from "../api";
import OrderCard from "../components/OrderCard";

export default function Orders({ user }) {
    const [orders,  setOrders] = useState([]);
    const [error, setError] = useState("");

useEffect(() => {
   const load = async () => {
 try {
      const res = await fetch(`${API}/orders`, {
        method: "GET",
        headers: authHeader(),
      });

   if (!res.ok) {
    const err = await res.json();
    setError(err.message || "Failed to load orders");
    setOrders([]);
    return;
  }

  const data = await res.json();
  setOrders(Array.isArray(data) ? data : []);
} catch (e) {
  setError("Network error")
}
  };
  
  load();
},  []); 

    const visibleOrders = Array.isArray(orders) ? orders.filter(order => {
          if(!user || !user.role) return true;

        if( user.role === "Washer") return order.status === "RECEIVED";
        if( user.role === "Ironer") return order.status === "WASHING";
        if( user.role === "Driver") return order.status === "READY FOR DELIVERY";
        return true;

    }) : [];

  return (
  <div className="space-y-3">
      <h2 className="text-lg font-bold">Orders</h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {visibleOrders.length === 0 && !error && (
        <p className="text-sm text-gray-500">No orders available</p>
      )}

      {visibleOrders.map((order )=> (
        <OrderCard key={order._id} order={order} user={user} />
      ))}
    </div>
  );
};