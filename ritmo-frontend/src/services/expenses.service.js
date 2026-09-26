import api from "./api";

async function getAll() {
  const response = await api.get("/expenses");
  return response.data.data;
}

async function create(expenseData) {
  const response = await api.post("/expenses", expenseData);
  return response.data.data;
}

async function update(id, expenseData) {
  const response = await api.put(`/expenses/${id}`, expenseData);
  return response.data.data;
}

async function remove(id) {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
}

export default { getAll, create, update, remove };