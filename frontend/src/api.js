export const API = "http://localhost:5000/api";

export const authHeader = () => ({
    Authorization: "Bearer" + localStorage.getItem("token"),
});