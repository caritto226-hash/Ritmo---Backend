import { useState } from "react";

const weekdays = ["L", "M", "X", "J", "V", "S", "D"];
const monthFormatter = new Intl.DateTimeFormat("es-CO", {
  month: "long",
  year: "numeric",
});

// Intl devuelve "octubre de 2026"; solo se pone en mayúscula la primera letra.
function formatMonth(date) {
  const label = monthFormatter.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getTodayKeyInBogota() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarDays(monthDate) {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

  return [
    ...Array.from({ length: leadingDays }, (_, index) => ({
      key: `empty-${index}`,
      day: null,
    })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), index + 1);
      return {
        key: toDateKey(date),
        day: index + 1,
      };
    }),
  ];
}

function DashboardCalendar({ commitmentDates, error }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const todayKey = getTodayKeyInBogota();
  const days = getCalendarDays(visibleMonth);

  function changeMonth(offset) {
    setVisibleMonth((current) => new Date(
      current.getFullYear(),
      current.getMonth() + offset,
      1,
    ));
  }

  return (
    <section className="card dashboard-widget-content dashboard-calendar">
      <header className="dashboard-calendar-header">
        <h2>Calendario</h2>
        <div className="dashboard-calendar-month-nav">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mes anterior"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <strong>{formatMonth(visibleMonth)}</strong>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Mes siguiente"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </header>

      <div className="dashboard-calendar-grid" role="grid" aria-label={formatMonth(visibleMonth)}>
        {weekdays.map((weekday, index) => (
          <span className="dashboard-calendar-weekday" role="columnheader" key={`${weekday}-${index}`}>
            {weekday}
          </span>
        ))}
        {days.map(({ key, day }) => {
          if (day === null) {
            return <span className="dashboard-calendar-empty" role="gridcell" key={key} />;
          }

          const hasCommitment = commitmentDates.has(key);
          const isToday = key === todayKey;

          return (
            <span
              className={[
                "dashboard-calendar-day",
                hasCommitment ? "has-commitment" : "",
                isToday ? "today" : "",
              ].filter(Boolean).join(" ")}
              role="gridcell"
              aria-label={`${day}${hasCommitment ? ", tiene compromisos" : ""}${isToday ? ", hoy" : ""}`}
              key={key}
            >
              {day}
            </span>
          );
        })}
      </div>

      <div className="dashboard-calendar-legend">
        <span className="dashboard-calendar-legend-dot" aria-hidden="true" />
        Fechas con tareas, eventos o pagos programados
      </div>
      {error && <p className="dashboard-calendar-error" role="status">{error}</p>}
    </section>
  );
}

export default DashboardCalendar;
