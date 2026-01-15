export default function Home({ user }) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">
        Welcome, {user.name}
      </h1>

      <p className="text-gray-600">
        Role: <strong>{user.role}</strong>
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded shadow">📦 Orders</div>
        <div className="bg-white p-4 rounded shadow">💰 Payments</div>
        <div className="bg-white p-4 rounded shadow">📊 Reports</div>
        <div className="bg-white p-4 rounded shadow">👤 Profile</div>
      </div>
    </div>
  );
}
