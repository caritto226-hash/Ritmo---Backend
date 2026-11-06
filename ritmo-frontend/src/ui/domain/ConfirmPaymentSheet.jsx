import { useId, useState } from "react";
import BottomSheet from "../primitives/BottomSheet";
import Icon from "../icons/Icon";
import CategoryIcon from "../../components/CategoryIcon";
import cx from "../cx";
import { getInkOnColor } from "../../utils/color";
import {
  addDaysToDate,
  formatCurrency,
  formatDayMonth,
  frequencyLabels,
  getTodayDate,
} from "../../utils/financeFormat";
import styles from "./ConfirmPaymentSheet.module.css";

const DATE_OPTIONS = [
  { value: "today", label: "Hoy" },
  { value: "yesterday", label: "Ayer" },
  { value: "other", label: "Otra" },
];

/**
 * Confirmar un pago o cobro recurrente (Confirmar.dc.html). Se confirma por occurrenceId con
 * la fecha real: Hoy, Ayer u Otra (nunca futura, en hora de Bogotá).
 * El monto es de solo lectura: el backend registra el valor de la recurrencia.
 * onConfirm(reminder, paidDate) y onCancel(reminder, scope) devuelven true si se aplicaron.
 */
function ConfirmPaymentSheet({ reminder, onClose, onConfirm, onCancel }) {
  const titleId = useId();
  const today = getTodayDate();
  const [dateOption, setDateOption] = useState("today");
  const [otherDate, setOtherDate] = useState(today);
  const [busy, setBusy] = useState(false);

  if (!reminder) return null;

  const isIncome = Number(reminder.amount) > 0;
  const color = reminder.category?.color;
  const paidDate = dateOption === "today" ? today : dateOption === "yesterday" ? addDaysToDate(today, -1) : otherDate;
  const validDate = Boolean(paidDate) && paidDate <= today;
  const meta = [
    reminder.category?.name,
    frequencyLabels[reminder.frequency] || reminder.frequency,
    `vence ${formatDayMonth(reminder.scheduledDate)}`,
  ].filter(Boolean).join(" · ");

  async function run(action) {
    if (busy) return;
    setBusy(true);
    const done = await action();
    setBusy(false);
    if (done) onClose();
  }

  const header = (
    <div className={styles.header}>
      <span
        className={styles.tile}
        style={color ? { background: color, color: getInkOnColor(color) } : undefined}
        aria-hidden="true"
      >
        <CategoryIcon name={reminder.category?.icon || "calendar-days"} size={24} />
      </span>
      <div className={styles.heading}>
        <h2 id={titleId} className={styles.title}>{reminder.concept}</h2>
        <span className={styles.meta}>{meta}</span>
      </div>
      <button type="button" className={styles.close} aria-label="Cerrar" onClick={onClose} disabled={busy}>
        <Icon name="close" size={20} strokeWidth={2} />
      </button>
    </div>
  );

  return (
    <BottomSheet open onClose={onClose} header={header} labelledBy={titleId} busy={busy}>
      <div className={styles.field}>
        <label htmlFor={`${titleId}-amount`} className={styles.label}>{isIncome ? "Monto recibido" : "Monto pagado"}</label>
        <input
          id={`${titleId}-amount`}
          className={styles.amount}
          value={formatCurrency(Math.abs(Number(reminder.amount)))}
          readOnly
          aria-readonly="true"
        />
      </div>

      <div className={styles.field}>
        <span id={`${titleId}-date`} className={styles.label}>Fecha real</span>
        <div className={styles.dates} role="group" aria-labelledby={`${titleId}-date`}>
          {DATE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.dateOption}
              aria-pressed={dateOption === option.value}
              onClick={() => setDateOption(option.value)}
              disabled={busy}
            >
              {option.value === "other" && <Icon name="tabCalendar" size={16} strokeWidth={2} />}
              {option.label}
            </button>
          ))}
        </div>
        {dateOption === "other" && (
          <input
            type="date"
            className={styles.dateInput}
            value={otherDate}
            max={today}
            onChange={(event) => setOtherDate(event.target.value)}
            aria-label={`Fecha real de ${isIncome ? "recepción" : "pago"}`}
            aria-invalid={!validDate}
            disabled={busy}
          />
        )}
      </div>

      <button
        type="button"
        className={styles.primary}
        onClick={() => run(() => onConfirm(reminder, paidDate))}
        disabled={busy || !validDate}
        data-autofocus
      >
        <Icon name="check" size={18} strokeWidth={2.6} />
        {busy ? "Guardando..." : isIncome ? "Marcar como recibido" : "Marcar como pagado"}
      </button>

      <div className={styles.secondary}>
        {reminder.isActive && (
          <button type="button" className={styles.textButton} onClick={() => run(() => onCancel(reminder, "future"))} disabled={busy}>
            Detener futuras
          </button>
        )}
        <button type="button" className={cx(styles.textButton, styles.danger)} onClick={() => run(() => onCancel(reminder, "all"))} disabled={busy}>
          Eliminar
        </button>
      </div>
    </BottomSheet>
  );
}

export default ConfirmPaymentSheet;
