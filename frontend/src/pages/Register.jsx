import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API } from "../api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    role: "Collector",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });

  const roles = useMemo(
    () => ["Collector", "Washer", "Ironer", "Driver", "Cashier", "Manager", "Hotel", "Sorter"],
    []
  );

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.phone.trim()) return "Phone is required";
    if (!form.role) return "Role is required";
    if (!form.password) return "Password is required";
    if (form.password.length < 4) return "Password must be at least 4 characters";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const err = validate();
    if (err) return showToast("error", err);

    try {
      setLoading(true);

      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          role: form.role, // Collector is mandatory (default)
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return showToast("error", data.message || "Failed to register");
      }

      showToast("success", "Registered successfully. Please login.");
      setTimeout(() => navigate("/login"), 800);
    } catch {
      showToast("error", "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Toast */}
      {toast.message && (
        <div
          className={`fixed top-5 right-5 px-4 py-3 rounded-lg shadow text-white ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="text-sm text-gray-500 mt-1">
          Register staff user (Collector required by system).
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
              placeholder="e.g. Sari Wello"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
              placeholder="e.g. 050xxxxxxx"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={onChange}
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Default is <b>Collector</b>.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
