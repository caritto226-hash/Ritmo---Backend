import { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../services/auth.service";
import "../styles/auth.css";

function ForgotPassword() {
  const [correo, setCorreo] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await authService.forgotPassword(correo);
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo enviar la solicitud");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="main-container">
      <div className="logo-wrapper">
        <img src="/Ritmo-logo.png" alt="Logo de Ritmo" className="logo" />
      </div>

      <h2 className="welcome-text">Recupera tu contraseña</h2>
      <p className="subtitle">Escribe el correo con el que te registraste</p>

      {message && (
        <div className="info-banner" role="status">
          {message}. Cuando tengas el código de recuperación,{" "}
          <Link to="/reset-password">crea tu nueva contraseña</Link>.
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon">⚠</span>
          <div>
            <strong>No se pudo enviar la solicitud</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="forgot-correo">Correo</label>
          <div className="input-wrapper">
            <input
              id="forgot-correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              maxLength={150}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Enviando..." : "Enviar instrucciones"}
        </button>
      </form>

      <p className="footer-links">
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </div>
  );
}

export default ForgotPassword;
