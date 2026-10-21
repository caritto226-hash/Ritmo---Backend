import axios from "axios";

export const TOKEN_KEY = "ritmoToken";
export const USER_EMAIL_KEY = "ritmoUserEmail";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Un 401 fuera de /auth significa que la sesión venció o fue revocada:
// se borra el token y se vuelve al login en lugar de mostrar pantallas vacías.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.startsWith("/auth/");

    if (error.response?.status === 401 && !isAuthRequest && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_EMAIL_KEY);
      window.location.assign("/login?expired=1");
    }

    return Promise.reject(error);
  },
);

export default api;
