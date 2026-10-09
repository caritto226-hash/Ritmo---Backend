import { useContext, useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import dashboardWidgets from "../constants/dashboardWidgets";

const defaultWidgetVisibility = Object.fromEntries(
  dashboardWidgets.map(({ id }) => [id, true]),
);

function MainLayout() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia("(min-width: 900px)").matches,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopMenuCollapsed, setDesktopMenuCollapsed] = useState(false);
  const [dashboardSettingsOpen, setDashboardSettingsOpen] = useState(false);
  const [dashboardWidgetVisibility, setDashboardWidgetVisibility] = useState(defaultWidgetVisibility);
  const [settingsError, setSettingsError] = useState("");
  const [theme, setTheme] = useState(
    () => (localStorage.getItem("ritmo-theme") === "dark" ? "dark" : "light"),
  );
  const widgetVisibilityKey = `ritmo-dashboard-widget-visibility-${user?.correo?.trim().toLowerCase() || "default"}`;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("ritmo-theme", theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 900px)");
    const updateDesktopMode = (event) => setIsDesktop(event.matches);

    mediaQuery.addEventListener("change", updateDesktopMode);
    return () => mediaQuery.removeEventListener("change", updateDesktopMode);
  }, []);

  useEffect(() => {
    try {
      const savedVisibility = localStorage.getItem(widgetVisibilityKey);
      const parsedVisibility = savedVisibility ? JSON.parse(savedVisibility) : {};
      setDashboardWidgetVisibility({
        ...defaultWidgetVisibility,
        ...Object.fromEntries(
          Object.keys(defaultWidgetVisibility)
            .filter((widgetId) => typeof parsedVisibility[widgetId] === "boolean")
            .map((widgetId) => [widgetId, parsedVisibility[widgetId]]),
        ),
      });
      setSettingsError("");
    } catch {
      setDashboardWidgetVisibility(defaultWidgetVisibility);
      setSettingsError("No se pudieron cargar los ajustes guardados de los widgets.");
    }
  }, [widgetVisibilityKey]);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key !== "Escape") return;
      if (dashboardSettingsOpen) {
        setDashboardSettingsOpen(false);
        return;
      }
      if (isDesktop) setDesktopMenuCollapsed(true);
      else setMenuOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [dashboardSettingsOpen, isDesktop]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  function updateWidgetVisibility(widgetId, isVisible) {
    const nextVisibility = { ...dashboardWidgetVisibility, [widgetId]: isVisible };
    setDashboardWidgetVisibility(nextVisibility);
    try {
      localStorage.setItem(widgetVisibilityKey, JSON.stringify(nextVisibility));
      setSettingsError("");
    } catch {
      setSettingsError("No se pudieron guardar los ajustes de los widgets.");
    }
  }

  function isActive(path) {
    return location.pathname === path ? "nav-item active" : "nav-item";
  }

  function isMenuLinkActive(path) {
    return location.pathname === path ? "side-menu-link active" : "side-menu-link";
  }

  const email = user?.correo || "";
  const avatar = email ? email.charAt(0).toUpperCase() : "R";
  const sideMenuHidden = isDesktop ? desktopMenuCollapsed : !menuOpen;

  return (
    <div className={`app ${desktopMenuCollapsed ? "menu-collapsed" : ""}`}>
      <header className="header">
        <button
          className="header-btn"
          type="button"
          aria-label={isDesktop ? "Mostrar menú" : menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isDesktop ? !desktopMenuCollapsed : menuOpen}
          aria-controls="side-menu"
          onClick={() => {
            if (isDesktop) setDesktopMenuCollapsed(false);
            else setMenuOpen((open) => !open);
          }}
        >
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

      <button
        type="button"
        className={`side-menu-overlay ${menuOpen ? "open" : ""}`}
        aria-label="Cerrar menú"
        tabIndex={!isDesktop && menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />
      <aside
        className={`side-menu ${menuOpen ? "open" : ""} ${desktopMenuCollapsed ? "desktop-collapsed" : ""}`}
        id="side-menu"
        aria-hidden={sideMenuHidden}
        inert={sideMenuHidden}
      >
        <div className="side-menu-header">
          <img src="/Ritmo-logo.png" alt="Ritmo" className="logo" />
          <button
            type="button"
            className="side-menu-close mobile-menu-close"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button
            type="button"
            className="side-menu-close desktop-menu-collapse"
            aria-label="Ocultar menú"
            title="Ocultar menú"
            onClick={() => setDesktopMenuCollapsed(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="side-menu-profile">
          <div className="avatar" aria-hidden="true">{avatar}</div>
          <div className="side-menu-profile-info">
            <strong>Mi cuenta</strong>
            {email && <span title={email}>{email}</span>}
          </div>
        </div>

        <nav aria-label="Navegación principal">
          <Link to="/dashboard" className={isMenuLinkActive("/dashboard")} onClick={() => setMenuOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12L12 3l9 9v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Inicio
          </Link>
          <Link to="/tasks" className={isMenuLinkActive("/tasks")} onClick={() => setMenuOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <polyline points="9 11 12 14 22 4" />
            </svg>
            Tareas
          </Link>
          <Link to="/habits" className={isMenuLinkActive("/habits")} onClick={() => setMenuOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Hábitos
          </Link>
          <Link to="/expenses" className={isMenuLinkActive("/expenses")} onClick={() => setMenuOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
            </svg>
            Finanzas
          </Link>
          <Link to="/events" className={isMenuLinkActive("/events")} onClick={() => setMenuOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Eventos
          </Link>
        </nav>

        <div className="side-menu-footer">
          <button
            type="button"
            className="side-menu-link"
            aria-haspopup="dialog"
            aria-expanded={dashboardSettingsOpen}
            onClick={() => {
              setDashboardSettingsOpen(true);
              setMenuOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 2.94-.08-.02a1.7 1.7 0 0 0-1.82.5l-.06.06h-3.4l-.03-.08a1.7 1.7 0 0 0-1.42-1.13l-.08-.01-1.7-2.94.06-.06A1.7 1.7 0 0 0 9.9 14.3l-.02-.08v-3.4l.08-.03a1.7 1.7 0 0 0 1.13-1.42l.01-.08 2.94-1.7.06.06a1.7 1.7 0 0 0 1.88.34l.06-.03 2.94 1.7-.02.08a1.7 1.7 0 0 0 .5 1.82l.06.06v3.4l-.08.03A1.7 1.7 0 0 0 19.4 15Z" />
            </svg>
            Ajustes
          </button>
          <button
            type="button"
            className="side-menu-link"
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {dashboardSettingsOpen && (
        <div
          className="dashboard-settings-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDashboardSettingsOpen(false);
          }}
        >
          <section
            className="dashboard-settings-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-settings-title"
          >
            <header className="dashboard-settings-header">
              <div>
                <h2 id="dashboard-settings-title">Ajustes del dashboard</h2>
                <p>Elige qué widgets quieres ver en Inicio.</p>
              </div>
              <button
                type="button"
                className="dashboard-settings-close"
                aria-label="Cerrar ajustes"
                onClick={() => setDashboardSettingsOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </header>
            {settingsError && <p className="dashboard-settings-error" role="alert">{settingsError}</p>}
            <div className="dashboard-settings-list">
              {dashboardWidgets.map(({ id, label }) => (
                <label className="dashboard-settings-option" key={id}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={dashboardWidgetVisibility[id] !== false}
                    onChange={(event) => updateWidgetVisibility(id, event.target.checked)}
                    aria-label={`Mostrar ${label}`}
                  />
                </label>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className="scroll-area">
        <Outlet context={{ theme, toggleTheme, widgetVisibility: dashboardWidgetVisibility }} />
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
          Finanzas
        </Link>
      </nav>
    </div>
  );
}

export default MainLayout;