import api from "./api";

async function getAll() {
  const response = await api.get("/events");
  return response.data.data;
}

async function create(eventData) {
  const response = await api.post("/events", eventData);
  return response.data.data;
}

async function update(id, eventData) {
  const response = await api.put(`/events/${id}`, eventData);
  return response.data.data;
}

async function remove(id) {
  const response = await api.delete(`/events/${id}`);
  return response.data;
}

export default { getAll, create, update, remove };