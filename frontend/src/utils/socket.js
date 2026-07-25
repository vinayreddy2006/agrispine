import { io } from "socket.io-client";

// Get the Base URL from the environment
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Remove '/api' and trailing slashes to get the root server URL
const SERVER_URL = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

// Initialize the socket connection globally
const socket = io.connect(SERVER_URL);

export default socket;