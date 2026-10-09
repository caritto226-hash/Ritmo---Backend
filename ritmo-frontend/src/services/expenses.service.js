import api from "./api";

async function getAll(categoryId) {
  const response = await api.get("/expenses", {
    params: categoryId ? { categoryId } : undefined,
  });
  return response.data.data;
}

async function getMonthlySummary() {
  const response = await api.get("/expenses/summary");
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

async function getRecurrenceReminders() {
  const response = await api.get("/expenses/recurrences/reminders");
  return response.data.data;
}

async function createRecurrence(recurrenceData) {
  const response = await api.post("/expenses/recurrences", recurrenceData);
  return response.data.data;
}

async function confirmRecurrenceOccurrence(occurrenceId, paidDate) {
  const response = await api.patch(`/expenses/recurrences/occurrences/${occurrenceId}/confirm`, {
    paidDate,
  });
  return response.data.data;
}

async function cancelRecurrence(recurrenceId, scope) {
  const response = await api.delete(`/expenses/recurrences/${recurrenceId}`, {
    params: { scope },
  });
  return response.data.data;
}

export default {
  getAll,
  getMonthlySummary,
  create,
  update,
  remove,
  getRecurrenceReminders,
  createRecurrence,
  confirmRecurrenceOccurrence,
  cancelRecurrence,
};