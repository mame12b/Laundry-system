import { useState } from "react";
import { API, authHeader } from "../api";

export default function Payments() {
    const [orderId, setOrderId] = useState("");
    const [amoubt, setAmount] = useState("");

    const submit = async() => {
        await fetch(`${API}/payments/${orderId}`, {
            method: "POST",
            headers: { ...authHeader(), "Content-Type": "application/json"},
            body: JSON.stringify({ amount }),
        });
        alert("Payment added");
    };

      return (
    <div className="mt-4 bg-white p-3 rounded shadow">
      <h2 className="font-bold mb-2">Add Payment</h2>
      <input className="border p-2 w-full mb-2" placeholder="Order ID" onChange={e=>setOrderId(e.target.value)} />
      <input className="border p-2 w-full mb-2" placeholder="Amount" onChange={e=>setAmount(e.target.value)} />
      <button className="bg-green-600 text-white w-full py-2 rounded" onClick={submit}>
        Submit Payment
      </button>
    </div>
  );
}
