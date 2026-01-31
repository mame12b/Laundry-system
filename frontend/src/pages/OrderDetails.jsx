import { useParams } from "react-router-dom";
import {useEffect, useState } from "react";
import {API, authHeader } from "../api.js";

export default function OrderDetails() {
    const { id } = useParams();
    const [order, setOrder ] = useState(null);

    useEffect(() => {
        fetch(`${API}/orders/${id}`, { headers: authHeader() })
        .then(r => r.json())
        .then(setOrder);
    }, [id]);

    if(!order) return <p>Loading...</p>;

      return (
        <div className="space-y-3">
        <h2 className="font-bold">Order {order._id}</h2>
        <p>Status: {order.status}</p>

        {order.items.map(i => (
            <div key={i._id} className="flex justify-between">
            <span>{i.item}</span>
            <span>{i.qty} × {i.price}</span>
            </div>
        ))}
        </div>
  );
}