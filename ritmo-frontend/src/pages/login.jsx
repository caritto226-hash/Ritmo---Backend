import { useState, useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/auth.css";

function Login() {
  const [searchParams] = useSearchParams();
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const sessionExpired = searchParams.get("expired") === "1";
  const passwordWasReset = searchParams.get("reset") === "1";
  const accountCreated = searchParams.get("registered") === "1";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(correo, contraseña);
      navigate("/dashboard");
    } catch (err) {
      // 429 = demasiados intentos; el resto de errores se muestra con un mensaje genérico.
      setError(err.response?.status === 429
        ? err.response.data.message
        : "Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="main-container">
      <div className="logo-wrapper">
        <img src="/Ritmo-logo.png" alt="Logo de Ritmo" className="logo" />
      </div>

      <h2 className="welcome-text">Bienvenido de nuevo</h2>
      <p className="subtitle">Ingresa tus datos para continuar</p>

      {!error && (sessionExpired || passwordWasReset || accountCreated) && (
        <div className="info-banner" role="status">
          {sessionExpired && "Tu sesión terminó. Inicia sesión de nuevo para continuar."}
          {passwordWasReset && "Contraseña actualizada. Ya puedes iniciar sesión."}
          {accountCreated && "Cuenta creada. Ya puedes iniciar sesión."}
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon">⚠</span>
          <div>
            <strong>Error al iniciar sesión</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="correo">Correo</label>
          <div className="input-wrapper">
            <input
              id="correo"
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
          <label htmlFor="contraseña">Contraseña</label>
          <div className="input-wrapper">
            <input
              id="contraseña"
              type={showPassword ? "text" : "password"}
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              autoComplete="current-password"
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

        <Link to="/forgot-password" className="forgot-password">¿Olvidaste tu contraseña?</Link>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="footer-links">
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </div>
  );
}

export default Login;
