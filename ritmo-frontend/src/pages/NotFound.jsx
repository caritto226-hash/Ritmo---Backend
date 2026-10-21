import { Link } from "react-router-dom";
import "../styles/auth.css";

function NotFound() {
  return (
    <div className="main-container">
      <div className="logo-wrapper">
        <img src="/Ritmo-logo.png" alt="Logo de Ritmo" className="logo" />
      </div>

      <h2 className="welcome-text">Página no encontrada</h2>
      <p className="subtitle">La dirección que buscas no existe o cambió de lugar.</p>

      <Link to="/dashboard" className="btn-primary not-found-link">Ir al inicio</Link>
    </div>
  );
}

export default NotFound;
