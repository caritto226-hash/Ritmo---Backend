import { API_URL, REQUEST_TIMEOUT_MS } from '../config';

// Error único para la app: "kind" indica el origen (config, network, timeout o http) y "status" el código HTTP.
export class ApiError extends Error {
  constructor(message, { status = null, kind = 'http' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
  }
}

function defaultMessage(status) {
  if (status === 401) {
    return 'Tu sesión expiró. Inicia sesión de nuevo.';
  }

  if (status >= 500) {
    return 'El servidor tuvo un problema. Intenta más tarde.';
  }

  return 'No se pudo completar la solicitud.';
}

// El backend responde JSON; si el cuerpo viene vacío o no es JSON se trata como null.
async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function request(path, { method = 'GET', body, token } = {}) {
  if (!API_URL) {
    throw new ApiError('Falta configurar EXPO_PUBLIC_API_URL en el archivo .env.', { kind: 'config' });
  }

  const headers = { Accept: 'application/json' };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // fetch no tiene tiempo límite propio: se cancela con AbortController si el servidor no responde.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const data = await readJson(response);

    if (!response.ok) {
      const message = data && typeof data.message === 'string' ? data.message : defaultMessage(response.status);
      throw new ApiError(message, { status: response.status });
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new ApiError('El servidor no respondió a tiempo. Intenta de nuevo.', { kind: 'timeout' });
    }

    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión.', { kind: 'network' });
  } finally {
    clearTimeout(timeoutId);
  }
}
