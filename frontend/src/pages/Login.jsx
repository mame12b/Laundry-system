import { use, useState } from "react";
import { API } from "../api";

export default function Login({ setUser }) {
    const [phone, setPhone] = useState("");
    const [password, setPassword ] = useState("");

    const login = async () => {
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type":  "application/json"},
            body: JSON.stringify({ phone, password }),
        });
        const data = await res.json();
        if(data.token) {
            localStorage.setItem("token", data.token);
            setUser(data.user);
        }
    };
      return (
    <div className="h-screen flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Staff Login</h2>
        <input className="border p-2 w-full mb-2" placeholder="Phone" onChange={e=>setPhone(e.target.value)} />
        <input className="border p-2 w-full mb-4" type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)} />
        <button className="bg-green-600 text-white w-full py-2 rounded" onClick={login}>
          Login
        </button>
      </div>
    </div>
  );

};