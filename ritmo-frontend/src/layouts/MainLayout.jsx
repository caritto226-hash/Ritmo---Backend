import { useContext } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

function MainLayout() {
  const { logout } = useContext(AuthContext);
  const location = useLocation();

  function isActive(path) {
    return location.pathname === path ? "nav-item active" : "nav-item";
  }

  return (
    <div className="app">
      <header className="header">
        <button className="header-btn" aria-label="Menú">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="logo-wrapper">
          <img src="/Ritmo-logo.png" alt="Logo de Ritmo" className="logo" style={{ width: "120px" }} />
        </div>

        <button className="notif-btn" aria-label="Cerrar sesión" onClick={logout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </header>

      <div className="scroll-area">
        <Outlet />
      </div>

      <nav className="bottom-nav">
        <Link to="/dashboard" className={isActive("/dashboard")}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 12L12 3l9 9v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
          </svg>
          Hoy
        </Link>
        <Link to="/tasks" className={isActive("/tasks")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          Tareas
        </Link>
        <Link to="/habits" className={isActive("/habits")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Hábitos
        </Link>
        <Link to="/events" className={isActive("/events")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Eventos
        </Link>
        <Link to="/expenses" className={isActive("/expenses")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
          </svg>
          Gastos
        </Link>
      </nav>
    </div>
  );
}

export default MainLayout;