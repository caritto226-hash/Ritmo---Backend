import api from "./api";

async function getAll(module = "finance") {
  const response = await api.get("/categories", { params: { module } });
  return response.data.data;
}

async function create(categoryData) {
  const response = await api.post("/categories", categoryData);
  return response.data.data;
}

async function update(id, categoryData) {
  const response = await api.patch(`/categories/${id}`, categoryData);
  return response.data.data;
}

async function remove(id) {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
}

export default { getAll, create, update, remove };
