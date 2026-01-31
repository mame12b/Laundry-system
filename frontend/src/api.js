// src/api.js
export const API = "http://localhost:5000/api";

export const authHeader = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return {};

  try {
    const user = JSON.parse(raw);
    if (!user.token) return {};

    return {
      Authorization: `Bearer ${user.token}`,
    };
  } catch {
    return {};
  }
};
