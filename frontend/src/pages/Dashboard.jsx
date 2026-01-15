import Orders from "./Orders";
import Payments from "./Payments";
import Navigation from "../components/Navigation";

export default function Dashboard({ user }) {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h1 className="text-lg font-bold">Welcome, {user.name}</h1>
        <p className="text-sm text-gray-500">Role: {user.role}</p>
      </div>

      {["COLLECTOR","WASHER","IRONER","DRIVER","ADMIN","Manager"].includes(user.role) && (
        <Orders user={user} />
       
      )}

      {["CASHIER","ADMIN","Manager"].includes(user.role) && <Payments />}
    </div>
  );
}

