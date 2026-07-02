import { io } from "socket.io-client";

// Get the Base URL from the environment
const API_URL = import.meta.env.VITE_API_BASE_URL;

// Remove '/api' to get the root server URL (e.g., https://agrispine-backend.onrender.com)
const SERVER_URL = API_URL ? API_URL.replace('/api', '') : "http://localhost:5000";

// Initialize the socket connection globally
const socket = io.connect(SERVER_URL);

export default socket;