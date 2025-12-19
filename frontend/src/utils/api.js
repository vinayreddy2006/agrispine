import axios from 'axios';

const api = axios.create({
  baseURL: 'https://agrispine-backend.onrender.com/', // Your Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;