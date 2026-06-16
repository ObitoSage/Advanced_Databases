import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

/** Extrae un mensaje de error legible de una respuesta de axios. */
export const mensajeError = (e: unknown, fallback = 'Ocurrió un error') => {
  if (axios.isAxiosError(e)) return e.response?.data?.error ?? fallback;
  return fallback;
};
