import { useState } from "react";
import CategoryIconBadge from "./CategoryIconBadge";
import "../styles/recurrence-reminders.css";

const frequencyLabels = {
  daily: "Diaria",
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

function getTodayDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(date);
}

function formatAmount(value) {
  const amount = Number(value);
  return `${amount < 0 ? "-$" : "$"}${Math.abs(amount).toLocaleString("es-CO", {
    minimumFractionDigits: Number.isInteger(Math.abs(amount)) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function getScheduleLabel(reminder) {
  if (reminder.isOverdue) return `Vencido desde ${formatDate(reminder.scheduledDate)}`;
  if (reminder.isUpcoming) return `Próximo · ${formatDate(reminder.scheduledDate)}`;
  return `Programado para ${formatDate(reminder.scheduledDate)}`;
}

// Tarjetas de recordatorio del dashboard (bloque compacto). Finanzas usa el carrusel "Por confirmar".
function FinanceRecurrenceReminders({
  reminders,
  onConfirm,
  compact = false,
}) {
  const [paymentDates, setPaymentDates] = useState({});
  const [confirmingId, setConfirmingId] = useState(null);

  if (!reminders.length) return null;

  // Bloquea el botón mientras la confirmación está en curso para no enviarla dos veces.
  async function handleConfirm(reminder, paidDate) {
    if (confirmingId !== null) return;
    setConfirmingId(reminder.occurrenceId);
    try {
      await onConfirm(reminder, paidDate);
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <section className={`finance-reminders ${compact ? "finance-reminders-compact" : ""}`} aria-label="Recordatorios de finanzas">
      {!compact && (
        <header className="finance-reminders-header">
          <div>
            <h2>Pagos e ingresos programados</h2>
            <p>Confirma cuando hayas pagado o recibido el movimiento.</p>
          </div>
        </header>
      )}
      <div className="finance-reminder-list">
        {reminders.map((reminder) => {
          const isIncome = Number(reminder.amount) > 0;
          const paidDate = paymentDates[reminder.occurrenceId] || getTodayDate();
          const isConfirming = confirmingId === reminder.occurrenceId;

          return (
            <article
              className={`finance-reminder ${reminder.isOverdue ? "overdue" : ""} ${compact ? "compact" : ""}`}
              key={reminder.occurrenceId}
            >
              <CategoryIconBadge
                category={reminder.category}
                fallbackIcon="calendar-days"
                size={20}
                className="finance-reminder-icon"
              />
              <div className="finance-reminder-copy">
                <div className="finance-reminder-title-row">
                  {reminder.isOverdue && <span className="finance-reminder-urgent-dot" aria-label="Pendiente vencido" />}
                  <h3>{reminder.concept}</h3>
                </div>
                <p>
                  {reminder.category?.name} · {frequencyLabels[reminder.frequency] || reminder.frequency}
                  {" · "}{getScheduleLabel(reminder)}
                </p>
                {!compact && <strong className={isIncome ? "income" : "expense"}>{formatAmount(reminder.amount)}</strong>}
              </div>
              <div className="finance-reminder-actions">
                <label className="finance-reminder-date">
                  <span>Fecha real</span>
                  <input
                    type="date"
                    value={paidDate}
                    max={getTodayDate()}
                    onChange={(event) => setPaymentDates((dates) => ({
                      ...dates,
                      [reminder.occurrenceId]: event.target.value,
                    }))}
                    aria-label={`Fecha real de ${isIncome ? "recepción" : "pago"} de ${reminder.concept}`}
                  />
                </label>
                <button
                  type="button"
                  className="finance-reminder-confirm"
                  onClick={() => handleConfirm(reminder, paidDate)}
                  disabled={confirmingId !== null}
                  aria-busy={isConfirming}
                >
                  {isConfirming ? "Confirmando..." : isIncome ? "Recibido" : "Pagado"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default FinanceRecurrenceReminders;
