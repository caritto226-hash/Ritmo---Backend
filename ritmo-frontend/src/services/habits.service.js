import api from "./api";

async function getAll() {
  const response = await api.get("/habits");
  return response.data.data;
}

async function create(habitData) {
  const response = await api.post("/habits", habitData);
  return response.data.data;
}

async function update(id, habitData) {
  const response = await api.put(`/habits/${id}`, habitData);
  return response.data.data;
}

// date (YYYY-MM-DD) es opcional: sin ella la API usa hoy.
async function changeStatus(id, status, date) {
  const response = await api.patch(`/habits/${id}/status`, date ? { status, date } : { status });
  return response.data.data;
}

// Avance del día en hábitos de cantidad o tiempo: { amount } fija el valor (0 lo borra) o
// { delta } suma; date opcional como en changeStatus.
async function updateProgress(id, progress) {
  const response = await api.patch(`/habits/${id}/progress`, progress);
  return response.data.data;
}

async function remove(id) {
  const response = await api.delete(`/habits/${id}`);
  return response.data;
}

export default { getAll, create, update, changeStatus, updateProgress, remove };
