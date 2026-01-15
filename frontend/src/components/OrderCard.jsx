import { API, authHeader } from "../api";

export default function OrderCard({ order, user })  {
const nextStatusMap = {
  PICKED: "RECEIVED",
  RECEIVED: "WASHING",
  WASHING: "IRONING",
  IRONING: "READY FOR DELIVERY",
  "READY FOR DELIVERY": "DELIVERED"
};
    const next = transitions[user.role];


    const updateStatus = async () => {
        await fetch(`${API}/orders/${order._id}/status`, {
            method: "PATCH",
            headers: { ...authHeader(), "Content-Type":  "application/json" },
            body: JSON.stringify({ status: next}),   
        });
        alert("Status updated");
    };

      return (
    <div className="bg-white p-3 rounded shadow mb-2">
      <p className="text-sm font-semibold">Customer: {order.customer?.name}</p>
      <p className="text-xs text-gray-500">Status: {order.status}</p>
      <p className="text-sm">Total: {order.totalAmount}</p>

        {nextStatusMap[order.status] && (
          <button
            className="bg-green-500 text-white px-2 py-1 rounded"
            onClick={() => updateStatus(nextStatusMap[order.status])}
          >
            Mark as {nextStatusMap[order.status]}
          </button>
        )}
    </div>
  );
}
