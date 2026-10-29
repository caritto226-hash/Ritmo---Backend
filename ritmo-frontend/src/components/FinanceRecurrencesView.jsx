import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import CategoryIconBadge from "./CategoryIconBadge";
import useDialogFocus from "../hooks/useDialogFocus";
import { formatCurrency, formatDayMonth, getDueLabel, getTodayDate } from "../utils/financeFormat";
import "../styles/finance-ui.css";

// Vista completa de pagos recurrentes ("Ver todos"). Cada fila abre la hoja: para confirmar si está
// pendiente, o para detener/eliminar si está al día. suspended pausa Escape/Tab mientras la hoja está encima.
function FinanceRecurrencesView({
  recurrences,
  reminders,
  lastPaidByRecurrence,
  suspended,
  onClose,
  onSelect,
  onCreate,
}) {
  const panelRef = useRef(null);
  const [tab, setTab] = useState(reminders.length > 0 ? "pending" : "settled");
  const today = getTodayDate();

  useDialogFocus(panelRef, true, onClose, !suspended);

  const reminderByRecurrence = new Map(reminders.map((reminder) => [reminder.recurrenceId, reminder]));
  const settled = recurrences.filter((recurrence) => !reminderByRecurrence.has(recurrence.recurrenceId));
  const recurrenceById = new Map(recurrences.map((recurrence) => [recurrence.recurrenceId, recurrence]));

  function settledMeta(recurrence) {
    const lastPaid = lastPaidByRecurrence.get(recurrence.recurrenceId);
    const paidWord = Number(recurrence.amount) > 0 ? "Recibida" : "Pagada";
    const parts = [];
    if (lastPaid) parts.push(`${paidWord} ${formatDayMonth(lastPaid)}`);
    parts.push(recurrence.isActive ? `próxima ${formatDayMonth(recurrence.nextScheduledDate)}` : "detenido");
    const text = parts.join(" · ");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  const rows = tab === "pending"
    ? reminders.map((reminder) => ({
      key: `pending-${reminder.occurrenceId}`,
      item: reminder,
      meta: getDueLabel(reminder.scheduledDate, today),
      pending: true,
      target: { recurrence: recurrenceById.get(reminder.recurrenceId) || null, reminder },
    }))
    : settled.map((recurrence) => ({
      key: `settled-${recurrence.recurrenceId}`,
      item: recurrence,
      meta: settledMeta(recurrence),
      pending: false,
      target: { recurrence, reminder: null },
    }));

  return createPortal(
    <div
      className="finance-view"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finance-view-title"
      ref={panelRef}
    >
      <header className="finance-view-header">
        <button type="button" className="finance-icon-button" onClick={onClose} aria-label="Volver" data-autofocus>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2 id="finance-view-title">Recurrentes</h2>
        <button type="button" className="finance-round-primary" onClick={onCreate} aria-label="Nuevo recurrente">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </header>

      <div className="finance-tabs" role="tablist" aria-label="Estado de los recurrentes">
        {[
          ["pending", `Por confirmar · ${reminders.length}`],
          ["settled", `Al día · ${settled.length}`],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`finance-tab-${value}`}
            aria-selected={tab === value}
            aria-controls="finance-view-panel"
            className={tab === value ? "active" : ""}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div id="finance-view-panel" role="tabpanel" aria-labelledby={`finance-tab-${tab}`} className="finance-view-body">
        {rows.length === 0 ? (
          <p className="finance-empty">
            {tab === "pending" ? "Nada por confirmar. Todo al día ✓" : "Aún no hay pagos al día."}
          </p>
        ) : (
          <ul className="finance-card-list">
            {rows.map(({ key, item, meta, pending, target }) => {
              const isIncome = Number(item.amount) > 0;
              return (
                <li key={key}>
                  <button type="button" className="finance-row" onClick={() => onSelect(target)}>
                    <CategoryIconBadge
                      category={item.category}
                      fallbackIcon="calendar-days"
                      size={20}
                      className="finance-row-icon"
                    />
                    <span className="finance-row-copy">
                      <span className="finance-row-title">{item.concept}</span>
                      <span className={`finance-row-meta ${pending ? "due" : ""}`}>{meta}</span>
                    </span>
                    <span className={`finance-row-amount ${isIncome ? "income" : ""}`}>
                      {formatCurrency(item.amount)}
                    </span>
                    <svg className="finance-row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="finance-view-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          Aparecen 2 días antes de su fecha. Toca uno para confirmarlo, detenerlo o eliminarlo.
        </p>
      </div>
    </div>,
    document.body,
  );
}

export default FinanceRecurrencesView;
