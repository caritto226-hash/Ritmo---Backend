import { useState } from "react";
import CategoryIconBadge from "./CategoryIconBadge";
import FinanceRecurrenceReminders, { RecurrenceCancelActions } from "./FinanceRecurrenceReminders";
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

// Una tarjeta por pago recurrente. Si tiene un recordatorio en su ventana (2 días antes, o vencido)
// se muestra pendiente, con fecha real y Pagado/Recibido; al confirmarlo pasa a "al día",
// que solo recuerda la próxima fecha. Las pendientes siempre se ven; las al día se pliegan.
function FinanceRecurringPayments({ recurrences, reminders, onConfirm, onCancel }) {
  const [open, setOpen] = useState(false);

  if (!recurrences.length) return null;

  const pendingRecurrenceIds = new Set(reminders.map((reminder) => reminder.recurrenceId));
  const settled = recurrences.filter((recurrence) => !pendingRecurrenceIds.has(recurrence.recurrenceId));

  const title = (
    <span className="finance-recurring-copy">
      <span className="finance-recurring-title">
        Pagos recurrentes
        <span className="finance-recurring-count">{recurrences.length}</span>
      </span>
      <span className="finance-recurring-hint">
        Aparecen para confirmar 2 días antes de cada fecha (el mismo día si son diarios).
      </span>
    </span>
  );

  return (
    <section className="finance-reminders finance-recurring" aria-label="Pagos recurrentes">
      <h2 className="finance-recurring-heading">{title}</h2>

      <FinanceRecurrenceReminders
        reminders={reminders}
        onConfirm={onConfirm}
        onCancel={onCancel}
        embedded
      />

      {settled.length > 0 && (
        <>
          <button
            type="button"
            className={`finance-recurring-toggle ${open ? "open" : ""}`}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="finance-recurring-settled"
          >
            <span className="finance-recurring-settled-label">
              Al día
              <span className="finance-recurring-count">{settled.length}</span>
            </span>
            <span className="finance-recurring-chevron" aria-hidden="true" />
          </button>
          <div className="finance-reminder-list" id="finance-recurring-settled" hidden={!open}>
            {settled.map((recurrence) => (
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
                  <RecurrenceCancelActions recurrence={recurrence} onCancel={onCancel} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default FinanceRecurringPayments;
