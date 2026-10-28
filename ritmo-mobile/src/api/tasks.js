import { ApiError, request } from './client';

export async function getTasks(token) {
  const data = await request('/tasks', { token });

  if (!data || !Array.isArray(data.data)) {
    throw new ApiError('El servidor respondió con un formato inesperado.');
  }

  return data.data;
}

export async function completeTask(token, id) {
  const data = await request(`/tasks/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    token,
    body: { status: 'completada' },
  });

  return data ? data.data : null;
}
