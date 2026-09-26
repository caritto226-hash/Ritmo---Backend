import api from "./api";

async function getDashboard() {
  const response = await api.get("/dashboard");
  return response.data.data;
}

export default {
  getDashboard,
};