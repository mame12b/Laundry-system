import { useEffect, useState } from "react";
import { API, authHeader } from "../api";

export default function Orders() {
    const [Orders,  setOrders] = useState([]);

    useEffect(() => {
        fetch(`${API}/orders`, {headers: authHeader() })
            .then(r=> r.json())
            .then(setOrders);
    }, []);

    const visibleOrders = orders.filter(o => {
        if( user.role === "Washer") return o.status === "Received";
        if( user.role === "Ironer") return o.status === "Washing";
        if( user.role === "Driver") return o.status === "Ready For Delivery";
        return true;

    });

  return (
    <div>
      <h2 className="font-bold mb-2">Orders</h2>
      {visibleOrders.map(o => (
        <OrderCard key={o._id} order={o} user={user} />
      ))}
    </div>
  );
};