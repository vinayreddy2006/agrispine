import axios from "axios";
import Swal from "sweetalert2";

const rawUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
// Strip trailing slash or /api if user accidentally added it in their environment variables
const baseURL = rawUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach auth token to outgoing requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && !config.headers["auth-token"]) {
      config.headers["auth-token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized Expired JWT / 401 Handling
let isSessionExpiredAlertOpen = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const errorMsg = error.response.data?.error || error.response.data?.message || "";
      const isExpired = 
        typeof errorMsg === "string" &&
        (errorMsg.toLowerCase().includes("jwt expired") ||
         errorMsg.toLowerCase().includes("token expired") ||
         errorMsg.toLowerCase().includes("session has expired") ||
         errorMsg.toLowerCase().includes("invalid token"));

      // Also trigger if 401 occurs when a token exists in localStorage (means invalid/expired token)
      const hasStoredToken = !!localStorage.getItem("token");

      if (isExpired || hasStoredToken) {
        // Clear expired credentials immediately
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Avoid alert loops or duplicates across parallel failing calls
        const currentPath = window.location.pathname + window.location.search;
        const isAuthPage = window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/register");

        if (!isSessionExpiredAlertOpen && !isAuthPage) {
          isSessionExpiredAlertOpen = true;

          Swal.fire({
            icon: "warning",
            title: "Session Expired",
            text: "Your login session has expired. Please log in again to continue.",
            confirmButtonColor: "#16a34a",
            confirmButtonText: "Log In",
            allowOutsideClick: false,
          }).then(() => {
            isSessionExpiredAlertOpen = false;
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          });
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
