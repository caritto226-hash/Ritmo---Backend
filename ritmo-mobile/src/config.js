// La URL de la API viene de EXPO_PUBLIC_API_URL (archivo .env); Expo la incrusta al compilar.
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;

// Se quita la barra final para poder concatenar rutas como "/auth/login".
export const API_URL = rawApiUrl ? rawApiUrl.trim().replace(/\/+$/, '') : '';

// Tiempo máximo de espera por respuesta antes de avisar que el servidor no responde.
export const REQUEST_TIMEOUT_MS = 10000;
