import { useState } from "react";
import { API, authHeader } from "../api";

export default function Payments() {
    const [orderId, setOrderId] = useState("");
    const [amount, setAmount] = useState("");

    const submit = async(e) => {
      e.preventDefault();

        await fetch(`${API}/payments/${orderId}`, {
            method: "POST",
            headers: authHeader(),
            body: JSON.stringify({ amount }),
        });

        alert("Payment added");
        setAmount("");
        setOrderId("");
    };

      return (
    <form onSubmit={submit} className="p-4 space-y-2">
      <input
        placeholder="Order ID"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
        className="border p-2 w-full"
      />

      <input
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border p-2 w-full"
        type="number"
      />

      <button className="bg-green-600 text-white p-2 w-full rounded">
        Submit Payment
      </button>
    </form>
  );
}
