import { Link } from "react-router-dom";
import { FiLock, FiArrowLeft, FiShield } from "react-icons/fi";

export default function Register() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiShield size={28} className="text-red-500" />
          </div>

          <h1 className="text-xl font-bold text-gray-900">Access Restricted</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Staff accounts are created exclusively by the <b className="text-gray-700">Manager</b>.
            Self-registration is not allowed.
          </p>

          <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 text-left">
            <FiLock size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-blue-700 text-xs leading-relaxed">
              Ask your Manager to create your account. They will give you a
              <b> 4-digit PIN</b> to use when logging in.
            </p>
          </div>

          <Link
            to="/login"
            className="mt-5 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            <FiArrowLeft size={16} /> Back to Login
          </Link>
        </div>

        <p className="text-slate-500 text-xs mt-4">
          © {new Date().getFullYear()} Laundry Management System
        </p>
      </div>
    </div>
  );
}
