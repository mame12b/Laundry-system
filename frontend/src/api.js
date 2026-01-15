export const API = "http://localhost:5000/api";

export const authHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization:  `Bearer ${token}`} : {};  
};