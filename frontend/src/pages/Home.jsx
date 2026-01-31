import { Link } from "react-router-dom";

export default function Home({ user }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold">Home</h1>
        <p className="text-gray-600 mt-2">
          Welcome back{user?.name ? `, ${user.name}` : ""}. Choose where you want to go.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
          <Link to="/orders" className="btn-secondary">View Orders</Link>
          <Link to="/payments" className="btn-secondary">Payments</Link>
          <Link to="/reports" className="btn-secondary">Reports</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Today’s Orders" value="—" />
        <Card title="Pending Deliveries" value="—" />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
