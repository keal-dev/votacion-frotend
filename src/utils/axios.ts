import axios from 'axios';
import Cookies from 'js-cookie';

// Configuración base de axios
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para peticiones (por ejemplo, para adjuntar el token)
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respuestas (manejo global de errores)
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (typeof window !== 'undefined') {
      // 401 Unauthorized
      if (error.response?.status === 401) {
        // Redirigir al login si expira la sesión, a menos que ya estemos en login
        if (window.location.pathname !== '/login') {
          Cookies.remove('token');
          window.location.href = '/login';
        }
      }

      // 503 Service Unavailable (Mantenimiento)
      if (error.response?.status === 503) {
        // Si no estamos ya en la página de mantenimiento, redirigimos
        if (!window.location.pathname.includes('/mantenimiento')) {
          Cookies.remove('token');
          window.location.href = '/mantenimiento';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
