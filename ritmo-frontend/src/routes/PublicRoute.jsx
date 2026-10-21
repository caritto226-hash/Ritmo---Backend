import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

// Pantallas de acceso (login, registro, recuperación): si ya hay sesión, van al dashboard.
function PublicRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicRoute;
