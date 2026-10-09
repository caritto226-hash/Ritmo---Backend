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

function FinanceRecurrenceReminders({
  reminders,
  onConfirm,
  onCancel,
  compact = false,
}) {
  const [paymentDates, setPaymentDates] = useState({});

  if (!reminders.length) return null;

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
          const canCancelFuture = reminder.isActive;

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
                  {" · "}{reminder.isOverdue ? "Vencido desde" : "Programado para"} {formatDate(reminder.scheduledDate)}
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
                  onClick={() => onConfirm(reminder, paidDate)}
                >
                  {isIncome ? "Recibido" : "Pagado"}
                </button>
                {!compact && (canCancelFuture || reminder.isCanceled) && (
                  <div className="finance-reminder-cancel-actions">
                    {canCancelFuture && (
                      <button
                        type="button"
                        onClick={() => onCancel(reminder, "future")}
                        aria-label={`Detener futuras fechas de ${reminder.concept}`}
                      >
                        Detener futuras
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onCancel(reminder, "all")}
                      aria-label={`Eliminar toda la recurrencia de ${reminder.concept}`}
                    >
                      Eliminar recurrencia
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default FinanceRecurrenceReminders;
