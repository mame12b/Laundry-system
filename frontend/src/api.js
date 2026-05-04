// src/api.js
export const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

export const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...authHeader(),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("user");
    window.location.href = "/login";
    return res;
  }

  return res;
};
