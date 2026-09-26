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

async function changeStatus(id, status) {
  const response = await api.patch(`/habits/${id}/status`, { status });
  return response.data.data;
}

async function remove(id) {
  const response = await api.delete(`/habits/${id}`);
  return response.data;
}

export default { getAll, create, update, changeStatus, remove };