import {  useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [user, setUser ] = useState(null);

  if(!user && localStorage.getItem("token")) {
    return <Dashboard />;
  }

  return user ? <Dashboard user={user} /> : <Login setUser= {setUser} />
}

