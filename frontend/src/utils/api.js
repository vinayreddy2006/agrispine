import axios from "axios";

const rawUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
// Strip trailing slash or /api if user accidentally added it in their environment variables
const baseURL = rawUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
