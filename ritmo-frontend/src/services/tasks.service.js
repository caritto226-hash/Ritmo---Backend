import api from "./api";

async function getAll() {
  const response = await api.get("/tasks");
  return response.data.data;
}

async function create(taskData) {
  const response = await api.post("/tasks", taskData);
  return response.data.data;
}

async function update(id, taskData) {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data.data;
}

async function changeStatus(id, status) {
  const response = await api.patch(`/tasks/${id}/status`, { status });
  return response.data.data;
}

async function remove(id) {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
}

export default { getAll, create, update, changeStatus, remove };