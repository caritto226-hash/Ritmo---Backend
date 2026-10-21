import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import "../styles/auth.css";

function Register() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      await authService.register(nombre, correo, password);
      navigate("/login?registered=1");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="main-container">
      <div className="logo-wrapper">
        <img src="/Ritmo-logo.png" alt="Logo de Ritmo" className="logo" />
      </div>

      <h2 className="welcome-text">Crea tu cuenta</h2>
      <p className="subtitle">Organiza tus tareas, hábitos, eventos y finanzas</p>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon">⚠</span>
          <div>
            <strong>No se pudo registrar</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="register-nombre">Nombre</label>
          <div className="input-wrapper">
            <input
              id="register-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={100}
              autoComplete="name"
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="register-correo">Correo</label>
          <div className="input-wrapper">
            <input
              id="register-correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              maxLength={150}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="register-password">Contraseña (mínimo 6 caracteres)</label>
          <div className="input-wrapper">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Ocultar" : "Ver"}
            </button>
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="register-confirm">Confirmar contraseña</label>
          <div className="input-wrapper">
            <input
              id="register-confirm"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="footer-links">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}

export default Register;
