import axios from 'axios';

const api = axios.create({
  baseURL: 'https://agrispine-backend.onrender.com/api', // Your Backend URL
 // baseURL : "http://localhost:5000/api",
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;