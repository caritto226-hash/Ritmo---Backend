import { ApiError, request } from './client';

export async function login(correo, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: { correo, 'contraseña': password },
  });

  if (!data || typeof data.token !== 'string' || data.token === '') {
    throw new ApiError('El servidor respondió sin token. Intenta de nuevo.');
  }

  return data.token;
}
