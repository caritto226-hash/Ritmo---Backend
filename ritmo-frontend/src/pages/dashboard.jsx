import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import dashboardService from "../services/dashboard.service";
import "../styles/dashboard.css";

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const result = await dashboardService.getDashboard();
        setData(result);
      } catch (err) {
        setError("No se pudo cargar el dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>{error}</p>;

  const { percentage } = data.todayRitmo;
  const circumference = 175.93;
  const dashOffset = circumference - (circumference * percentage) / 100;

  function iconColorFor(type) {
    if (type === "habit") return "purple";
    if (type === "expense") return "green";
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

      <div className="greeting">
        <h1>Hola ✨</h1>
        <p>¿Cómo va tu ritmo hoy?</p>
      </div>

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
              {data.todayRitmo.completed} de {data.todayRitmo.total} tareas completadas
            </h3>
            <p className="sub"><span>♥</span> ¡Mantén tu ritmo!</p>
          </div>
        </div>
      </div>

      <div>
        <p className="section-label">Acciones rápidas</p>
        <div className="quick-actions">
          <Link to="/tasks" className="qa-item">
            <div className="qa-btn qa-tarea">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <span className="qa-label">Tarea</span>
          </Link>
          <Link to="/habits" className="qa-item">
            <div className="qa-btn qa-habito">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="qa-label">Hábito</span>
          </Link>
          <Link to="/expenses" className="qa-item">
            <div className="qa-btn qa-gasto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <span className="qa-label">Gasto</span>
          </Link>
          <Link to="/events" className="qa-item">
            <div className="qa-btn qa-evento">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="3" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <span className="qa-label">Evento</span>
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
              <span className={`item-dot ${iconColorFor(item.type)}`}></span>
              <div className={`item-icon ${iconColorFor(item.type)}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {iconFor(item.type)}
                </svg>
              </div>
              <div className="item-info">
                <h4>{item.title || item.name || item.concept}</h4>
                <p>
                  {item.date && new Date(item.date).toLocaleDateString("es-CO")}
                  {item.amount && ` · $${item.amount}`}
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