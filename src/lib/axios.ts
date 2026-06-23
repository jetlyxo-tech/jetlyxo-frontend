import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const path = window.location.pathname;

    const protectedPages = [
      "/dashboard",
      "/bookings",
      "/my-bookings",
      "/payment",
      "/ticket",
      "/profile",
      "/flight-passenger",
      "/bus-passenger",
      "/train-passenger",
      "/checkout",
      "/scanner",
      "/admin"
    ];

    const onProtectedPage = protectedPages.some((p) =>
      path.startsWith(p)
    );

    if (status === 401 && onProtectedPage) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      sessionStorage.setItem(
        "sessionExpired",
        "Your session expired. Please login again."
      );

      if (path !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;