import { createContext, useState, useEffect } from "react";
import authService from "../services/auth.service";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ritmoToken");

    if (token) {
      // Por ahora solo confirmamos que existe un token.
      // Más adelante podemos decodificarlo para leer el rol.
      setUser({ token });
    }

    setLoading(false);
  }, []);

  async function login(correo, contraseña) {
    const data = await authService.login(correo, contraseña);

    localStorage.setItem("ritmoToken", data.token);
    setUser({ token: data.token });

    return data;
  }

  function logout() {
    localStorage.removeItem("ritmoToken");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}