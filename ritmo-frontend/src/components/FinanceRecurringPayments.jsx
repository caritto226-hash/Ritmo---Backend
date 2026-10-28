import { useState } from "react";
import CategoryIconBadge from "./CategoryIconBadge";
import "../styles/recurrence-reminders.css";

const frequencyLabels = {
  daily: "Diaria",
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(date);
}

// Configuración de los pagos recurrentes: se listan todos, sin importar la ventana de recordatorios.
// Empieza plegada para no empujar hacia abajo la lista de movimientos.
function FinanceRecurringPayments({ recurrences, onCancel }) {
  const [open, setOpen] = useState(false);

  if (!recurrences.length) return null;

  return (
    <section className="finance-reminders finance-recurring" aria-label="Pagos recurrentes">
      <h2 className="finance-recurring-heading">
        <button
          type="button"
          className={`finance-recurring-toggle ${open ? "open" : ""}`}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="finance-recurring-list"
        >
          <span className="finance-recurring-copy">
            <span className="finance-recurring-title">
              Pagos recurrentes
              <span className="finance-recurring-count">{recurrences.length}</span>
            </span>
            <span className="finance-recurring-hint">
              El recordatorio aparece 2 días antes de cada fecha (el mismo día si es diario).
            </span>
          </span>
          <span className="finance-recurring-chevron" aria-hidden="true" />
        </button>
      </h2>
      <div className="finance-reminder-list" id="finance-recurring-list" hidden={!open}>
        {recurrences.map((recurrence) => (
          <article className="finance-reminder finance-recurring-item" key={recurrence.recurrenceId}>
            <CategoryIconBadge
              category={recurrence.category}
              fallbackIcon="calendar-days"
              size={20}
              className="finance-reminder-icon"
            />
            <div className="finance-reminder-copy">
              <div className="finance-reminder-title-row">
                <h3>{recurrence.concept}</h3>
              </div>
              <p>
                {frequencyLabels[recurrence.frequency] || recurrence.frequency}
                {" · "}
                {recurrence.isActive
                  ? `Próxima fecha: ${formatDate(recurrence.nextScheduledDate)}`
                  : `Detenido · pendiente del ${formatDate(recurrence.pendingScheduledDate)}`}
              </p>
            </div>
            <div className="finance-reminder-actions">
              <div className="finance-reminder-cancel-actions">
                {recurrence.isActive && (
                  <button
                    type="button"
                    onClick={() => onCancel(recurrence, "future")}
                    aria-label={`Detener futuras fechas de ${recurrence.concept}`}
                  >
                    Detener futuras
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onCancel(recurrence, "all")}
                  aria-label={`Eliminar toda la recurrencia de ${recurrence.concept}`}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FinanceRecurringPayments;
