import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authService from "../services/auth.service";
import "../styles/auth.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  // El código puede llegar en el enlace (?token=...) o escribirse a mano.
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token.trim(), password);
      navigate("/login?reset=1");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="main-container">
      <div className="logo-wrapper">
        <img src="/Ritmo-logo.png" alt="Logo de Ritmo" className="logo" />
      </div>

      <h2 className="welcome-text">Nueva contraseña</h2>
      <p className="subtitle">El código de recuperación vence a los 15 minutos</p>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon">⚠</span>
          <div>
            <strong>No se pudo actualizar</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="reset-token">Código de recuperación</label>
          <div className="input-wrapper">
            <input
              id="reset-token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="one-time-code"
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="reset-password">Nueva contraseña (mínimo 6 caracteres)</label>
          <div className="input-wrapper">
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="reset-confirm">Confirmar contraseña</label>
          <div className="input-wrapper">
            <input
              id="reset-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>

      <p className="footer-links">
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </div>
  );
}

export default ResetPassword;
