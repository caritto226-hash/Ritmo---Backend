import api from "./api";

async function login(correo, contraseña) {
  const response = await api.post("/auth/login", {
    correo,
    contraseña,
  });

  return response.data;
}

async function register(nombre, correo, password) {
  const response = await api.post("/users", { nombre, correo, password });

  return response.data;
}

async function forgotPassword(correo) {
  const response = await api.post("/auth/forgot-password", { correo });

  return response.data;
}

async function resetPassword(token, nuevaContrasena) {
  const response = await api.post("/auth/reset-password", { token, nuevaContrasena });

  return response.data;
}

export default {
  login,
  register,
  forgotPassword,
  resetPassword,
};
