export default function Navigation({ user }) {
    return (
        <nav className="flex gap-3 text-sm bg-white shadow p-3 rounded">
            <a href = "/dashboard">Dashboard</a>
            <a href ="/orders">Orders</a>
            {(user.role === "Cashier" || user.role === "Manager") && <a href="/payments">Payments</a>}
            {user.role === "Manager" && <a href="/reports">Reports</a>}
        </nav>
    );
}