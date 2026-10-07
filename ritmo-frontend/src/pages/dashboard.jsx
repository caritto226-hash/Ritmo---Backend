import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import dashboardService from "../services/dashboard.service";
import "../styles/dashboard.css";

function formatCurrency(value) {
  const amount = Number(value);
  const formatted = Math.abs(amount).toLocaleString("es-CO", {
    minimumFractionDigits: Number.isInteger(Math.abs(amount)) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-$" : "$"}${formatted}`;
}

function Dashboard() {
  const { theme, toggleTheme } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      try {
        const result = await dashboardService.getDashboard();
        if (active) {
          setData(result);
          setError("");
        }
      } catch {
        if (active) setError("No se pudo cargar el dashboard");
      } finally {
        if (active) setLoading(false);
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") fetchDashboard();
    }

    fetchDashboard();

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const greeting = (
    <div className="greeting dashboard-greeting">
      <div>
        <h1>Hola ✨</h1>
        <p>¿Cómo va tu ritmo hoy?</p>
      </div>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
        title={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
      >
        {theme === "dark" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
          </svg>
        )}
      </button>
    </div>
  );

  if (loading) return <>{greeting}<p>Cargando...</p></>;
  if (error) return <>{greeting}<p>{error}</p></>;

  const { percentage, tasks, habits, pending } = data.todayRitmo;
  const circumference = 175.93;
  const dashOffset = circumference - (circumference * percentage) / 100;

  function iconColorFor(item) {
    if (item.type === "habit") return "purple";
    if (item.type === "expense") return Number(item.amount) < 0 ? "orange" : "green";
    return "orange";
  }

  function iconFor(type) {
    if (type === "habit") {
      return (
        <path d="M12 2C8 7 5 10 5 14a7 7 0 0 0 14 0C19 10 16 7 12 2z" />
      );
    }
    if (type === "expense") {
      return <circle cx="12" cy="12" r="9" />;
    }
    if (type === "event") {
      return (
        <>
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </>
      );
    }
    return <polyline points="9 11 12 14 22 4" />;
  }

  return (
    <>
      {/* Definición del degradado del donut — invisible, solo la usa el SVG de abajo */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f5a66d" />
            <stop offset="100%" stopColor="#e07fa0" />
          </linearGradient>
        </defs>
      </svg>

      {greeting}

      <div className="card">
        <div className="ritmo-card-header">
          <span>Tu ritmo de hoy</span>
          <a href="#" className="ver-link">Ver agenda ›</a>
        </div>
        <div className="ritmo-card">
          <div className="donut-wrap">
            <svg width="76" height="76" viewBox="0 0 76 76">
              <circle className="donut-bg" cx="38" cy="38" r="28" />
              <circle
                className="donut-fg"
                cx="38"
                cy="38"
                r="28"
                style={{ strokeDashoffset: dashOffset }}
              />
            </svg>
            <div className="donut-label">{percentage}%</div>
          </div>
          <div className="ritmo-info">
            <h3>
              {data.todayRitmo.completed} de {data.todayRitmo.total} actividades completadas
            </h3>
            <p className="sub">
              <span>♥</span> Tareas {tasks.completed}/{tasks.total} · Hábitos {habits.completed}/{habits.total} · {pending} pendientes
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="section-label">Acciones rápidas</p>
        <div className="quick-actions">
          <Link to="/tasks" className="qa-item">
            <div className="qa-btn qa-tarea">
              <img src="/tarea.png" alt="" />
            </div>
            <span className="qa-label">Tarea</span>
          </Link>
          <Link to="/habits" className="qa-item">
            <div className="qa-btn qa-habito">
              <img src="/habito.png" alt="" />
            </div>
            <span className="qa-label">Hábito</span>
          </Link>
          <Link to="/expenses" className="qa-item">
            <div className="qa-btn qa-gasto">
              <img src="/finanzas.png" alt="" />
            </div>
            <span className="qa-label">Finanzas</span>
          </Link>
          <Link to="/events" className="qa-item">
            <div className="qa-btn qa-evento">
              <img src="/calendario.png" alt="" />
            </div>
            <span className="qa-label">Calendario</span>
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="proximos-header">
          <span>Próximos</span>
        </div>
        <div className="timeline">
          {data.upcoming.map((item) => (
            <div className="item" key={`${item.type}-${item.id}`}>
              <span className={`item-dot ${iconColorFor(item)}`}></span>
              <div className={`item-icon ${iconColorFor(item)}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {iconFor(item.type)}
                </svg>
              </div>
              <div className="item-info">
                <h4>{item.title || item.name || item.concept}</h4>
                <p>
                  {item.date && new Date(item.date).toLocaleDateString("es-CO")}
                  {item.amount !== undefined && item.amount !== null &&
                    ` · ${Number(item.amount) > 0 ? "+" : ""}${formatCurrency(item.amount)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="motiv-card">
        <p className="motiv-title">✦ Pequeños pasos, gran ritmo ♥</p>
        <p className="motiv-sub">Vas muy bien, sigue así ✨</p>
      </div>
    </>
  );
}

export default Dashboard;