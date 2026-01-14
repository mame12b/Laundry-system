import Orders from "./Orders";
import Payments from "./Payments";

export default function Dashboard({ user }) {
      return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h1 className="text-lg font-bold">Welcome, {user?.name}</h1>
        <p className="text-sm text-gray-500">Role: {user?.role}</p>
      </div>

      {["COLLECTOR","WASHER","IRONER","ADMIN"].includes(user?.role) && <Orders />}
      {["CASHIER","ADMIN"].includes(user?.role) && <Payments />}
    </div>
  );
}
