import api from "./api";

async function login(correo, contraseña) {
  const response = await api.post("/auth/login", {
    correo,
    contraseña,
  });

  return response.data;
}

export default {
  login,
};