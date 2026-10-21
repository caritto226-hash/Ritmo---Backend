import { createContext, useState, useEffect } from "react";
import authService from "../services/auth.service";
import { TOKEN_KEY, USER_EMAIL_KEY } from "../services/api";

export const AuthContext = createContext();

// Lee "exp" del JWT (sin verificar la firma, eso lo hace el backend) para descartar tokens vencidos.
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token && !isTokenExpired(token)) {
      setUser({ token, correo: localStorage.getItem(USER_EMAIL_KEY) || "" });
    } else if (token) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_EMAIL_KEY);
    }

    setLoading(false);
  }, []);

  async function login(correo, contraseña) {
    const data = await authService.login(correo, contraseña);

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_EMAIL_KEY, correo);
    setUser({ token: data.token, correo });

    return data;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
