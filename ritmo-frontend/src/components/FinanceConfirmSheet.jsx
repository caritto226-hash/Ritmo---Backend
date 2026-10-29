import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import CategoryIconBadge from "./CategoryIconBadge";
import useDialogFocus from "../hooks/useDialogFocus";
import {
  addDaysToDate,
  formatCurrency,
  formatDayMonth,
  frequencyLabels,
  getTodayDate,
} from "../utils/financeFormat";
import "../styles/finance-ui.css";

// Hoja inferior de un pago recurrente. Con reminder (pendiente en su ventana) permite confirmarlo;
// sin reminder (al día) solo muestra la próxima fecha y las acciones Editar / Detener futuras / Eliminar.
// El monto es de solo lectura: si se pagó otro valor, se corrige luego desde el movimiento;
// para cambiar el valor de los próximos pagos se usa Editar (onEdit).
function FinanceConfirmSheet({ recurrence, reminder, lastPaidDate, onClose, onConfirm, onCancel, onEdit }) {
  const sheetRef = useRef(null);
  const today = getTodayDate();
  const [dateOption, setDateOption] = useState("today");
  const [otherDate, setOtherDate] = useState(today);
  const [busy, setBusy] = useState(false);

  useDialogFocus(sheetRef, true, onClose, !busy);

  const item = reminder || recurrence;
  const isIncome = Number(item.amount) > 0;
  const titleId = `finance-sheet-title-${item.recurrenceId}`;
  const paidDate = dateOption === "today" ? today : dateOption === "yesterday" ? addDaysToDate(today, -1) : otherDate;
  const meta = [
    item.category?.name,
    frequencyLabels[item.frequency] || item.frequency,
    reminder
      ? `vence ${formatDayMonth(reminder.scheduledDate)}`
      : [
        lastPaidDate && `${isIncome ? "recibida" : "pagada"} ${formatDayMonth(lastPaidDate)}`,
        recurrence.isActive && `próxima ${formatDayMonth(recurrence.nextScheduledDate)}`,
      ].filter(Boolean).join(" · "),
  ].filter(Boolean).join(" · ");

  async function handleConfirm() {
    if (busy || !paidDate) return;
    setBusy(true);
    const confirmed = await onConfirm(reminder, paidDate);
    setBusy(false);
    if (confirmed) onClose();
  }

  async function handleCancel(scope) {
    if (busy) return;
    setBusy(true);
    const canceled = await onCancel(recurrence || reminder, scope);
    setBusy(false);
    if (canceled) onClose();
  }

  return createPortal(
    <div className="finance-sheet-layer">
      <div className="finance-sheet-backdrop" onClick={() => !busy && onClose()} aria-hidden="true" />
      <div
        className="finance-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={sheetRef}
      >
        <span className="finance-sheet-handle" aria-hidden="true" />
        <header className="finance-sheet-header">
          <CategoryIconBadge
            category={item.category}
            fallbackIcon="calendar-days"
            size={24}
            className="finance-sheet-icon"
          />
          <div className="finance-sheet-heading">
            <h2 id={titleId}>{item.concept}</h2>
            <p>{meta}</p>
          </div>
          <button
            type="button"
            className="finance-icon-button"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={busy}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {reminder && (
          <>
            <div className="finance-sheet-field">
              <span className="finance-sheet-label">{isIncome ? "Monto a recibir" : "Monto a pagar"}</span>
              <p className={`finance-sheet-amount ${isIncome ? "income" : ""}`}>{formatCurrency(item.amount)}</p>
            </div>

            <div className="finance-sheet-field">
              <span className="finance-sheet-label" id={`${titleId}-date`}>Fecha real</span>
              <div className="finance-segmented" role="group" aria-labelledby={`${titleId}-date`}>
                {[
                  ["today", "Hoy"],
                  ["yesterday", "Ayer"],
                  ["other", "Otra"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={dateOption === value ? "active" : ""}
                    aria-pressed={dateOption === value}
                    onClick={() => setDateOption(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {dateOption === "other" && (
                <input
                  type="date"
                  className="finance-sheet-date"
                  value={otherDate}
                  max={today}
                  onChange={(event) => setOtherDate(event.target.value)}
                  aria-label={`Fecha real de ${isIncome ? "recepción" : "pago"}`}
                  autoFocus
                />
              )}
            </div>

            <button
              type="button"
              className="finance-sheet-primary"
              onClick={handleConfirm}
              disabled={busy || !paidDate}
              data-autofocus
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {busy ? "Guardando..." : isIncome ? "Marcar como recibido" : "Marcar como pagado"}
            </button>
          </>
        )}

        <div className="finance-sheet-secondary">
          {onEdit && (
            <button type="button" onClick={onEdit} disabled={busy}>
              Editar
            </button>
          )}
          {item.isActive && (
            <button type="button" onClick={() => handleCancel("future")} disabled={busy}>
              Detener futuras
            </button>
          )}
          <button type="button" className="danger" onClick={() => handleCancel("all")} disabled={busy}>
            Eliminar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default FinanceConfirmSheet;
