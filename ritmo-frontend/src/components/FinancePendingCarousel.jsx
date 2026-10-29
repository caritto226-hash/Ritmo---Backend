import CategoryIconBadge from "./CategoryIconBadge";
import { formatCurrency, frequencyLabels, getDueLabel, getTodayDate } from "../utils/financeFormat";
import "../styles/finance-ui.css";

// "Por confirmar": recordatorios dentro de su ventana (2 días antes, el mismo día si es diario, o vencidos).
// Cada tarjeta solo abre la hoja de confirmar; la fecha real y las demás acciones viven allí.
// Sin pendientes la sección se oculta; si hay recurrentes al día queda una línea para llegar a "Ver todos".
function FinancePendingCarousel({ reminders, hasRecurrences, onOpen, onViewAll }) {
  if (!reminders.length) {
    if (!hasRecurrences) return null;
    return (
      <div className="finance-pending-empty">
        <span>Pagos recurrentes al día ✓</span>
        <button type="button" className="finance-link-button" onClick={onViewAll}>
          Ver todos
        </button>
      </div>
    );
  }

  const today = getTodayDate();

  return (
    <section className="finance-pending" aria-labelledby="finance-pending-title">
      <header className="finance-section-header">
        <h2 id="finance-pending-title">
          Por confirmar
          <span className="finance-count">{reminders.length}</span>
        </h2>
        <button type="button" className="finance-link-button" onClick={onViewAll}>
          Ver todos
        </button>
      </header>
      <ul className="finance-pending-track">
        {reminders.map((reminder) => {
          const isIncome = Number(reminder.amount) > 0;
          const action = isIncome ? "Recibido" : "Pagado";
          return (
            <li className={`finance-pending-card ${reminder.isOverdue ? "overdue" : ""}`} key={reminder.occurrenceId}>
              <div className="finance-pending-top">
                <CategoryIconBadge
                  category={reminder.category}
                  fallbackIcon="calendar-days"
                  size={20}
                  className="finance-row-icon"
                />
                <div className="finance-pending-copy">
                  <h3>{reminder.concept}</h3>
                  <p>
                    <strong>{getDueLabel(reminder.scheduledDate, today)}</strong>
                    {" · "}{frequencyLabels[reminder.frequency] || reminder.frequency}
                  </p>
                </div>
              </div>
              <div className="finance-pending-bottom">
                <span className={`finance-pending-amount ${isIncome ? "income" : ""}`}>
                  {formatCurrency(reminder.amount)}
                </span>
                <button
                  type="button"
                  className="finance-primary-pill"
                  onClick={() => onOpen(reminder)}
                  aria-label={`${action}: ${reminder.concept}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {action}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default FinancePendingCarousel;
