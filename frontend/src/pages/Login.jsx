import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API } from "../api.js";

export default function Login({ setUser }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate(); // ✅ ADD THIS

  const redirectByRole = (role) => {
    const r = (role || "").toUpperCase();
    if (r === "MANAGER") return "/dashboard";
    if (r === "CASHIER") return "/payments";
    return "/orders";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid phone or password");
        return;
      }

      const savedUser = { ...data.user, token: data.token };

      localStorage.setItem("user", JSON.stringify(savedUser));
      setUser(savedUser);

      navigate(redirectByRole(savedUser.role), { replace: true }); // ✅ ADD THIS
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">Laundry System</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}



        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxx"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Register link */}
<div className="text-center mt-4 text-sm">
  <span className="text-gray-600">Don’t have an account?</span>{" "}
  <Link
    to="/register"
    className="text-blue-600 font-medium hover:underline"
  >
    Register
  </Link>
</div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} Laundry Management System
        </div>
      </div>
    </div>
  );
}
