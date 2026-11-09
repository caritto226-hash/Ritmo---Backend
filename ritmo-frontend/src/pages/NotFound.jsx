import { Link } from "react-router-dom";
import BrandLogo from "../ui/shell/BrandLogo";
import "../styles/auth.css";

function NotFound() {
  return (
    <div className="main-container">
      <div className="logo-wrapper" role="img" aria-label="Ritmo">
        <BrandLogo size="auth" />
      </div>

      <h1 className="welcome-text">Página no encontrada</h1>
      <p className="subtitle">La dirección que buscas no existe o cambió de lugar.</p>

      <Link to="/dashboard" className="btn-primary not-found-link">Ir al inicio</Link>
    </div>
  );
}

export default NotFound;
