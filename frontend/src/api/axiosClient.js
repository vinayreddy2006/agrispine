import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:5000/api', // Adjust base URL as needed
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to attach auth token to every request
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['auth-token'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor for response handling (e.g., global error handling)
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized, e.g. redirect to login or clear token
            // localStorage.removeItem('token');
            // localStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
