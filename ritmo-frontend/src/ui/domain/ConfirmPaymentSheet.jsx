import { useId, useState } from "react";
import BottomSheet from "../primitives/BottomSheet";
import PillButton from "../primitives/PillButton";
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

// Mismos textos de la pantalla anterior; ahora se preguntan dentro de la hoja (sin window.confirm).
function cancelQuestion(item, scope) {
  return scope === "future"
    ? `¿Detener las próximas fechas de "${item.concept}"? Los movimientos históricos y los recordatorios vencidos se conservarán.`
    : `¿Eliminar todos los recordatorios de "${item.concept}"? Los movimientos históricos ya registrados se conservarán.`;
}

/**
 * Hoja de un pago o cobro recurrente (Confirmar.dc.html).
 * Con reminder (pendiente en su ventana) se confirma por occurrenceId con la fecha real: Hoy, Ayer
 * u Otra (nunca futura, en hora de Bogotá). El monto es de solo lectura: el backend registra el
 * valor de la recurrencia. Sin reminder (recurrente al día, pasar recurrence) solo muestra la
 * última y la próxima fecha y las acciones.
 * Acciones de texto: Editar (si llega onEdit), Detener futuras (scope "future", si sigue activo)
 * y Eliminar (scope "all"); las dos últimas piden confirmación en la misma hoja.
 * onConfirm(reminder, paidDate) y onCancel(item, scope) devuelven true si se aplicaron.
 */
function ConfirmPaymentSheet({ reminder, recurrence, lastPaidDate, onClose, onConfirm, onCancel, onEdit }) {
  const titleId = useId();
  const today = getTodayDate();
  const [dateOption, setDateOption] = useState("today");
  const [otherDate, setOtherDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [askingScope, setAskingScope] = useState(null);

  const item = reminder || recurrence;
  if (!item) return null;

  const isIncome = Number(item.amount) > 0;
  const color = item.category?.color;
  const paidDate = dateOption === "today" ? today : dateOption === "yesterday" ? addDaysToDate(today, -1) : otherDate;
  const validDate = Boolean(paidDate) && paidDate <= today;
  const meta = [
    item.category?.name,
    frequencyLabels[item.frequency] || item.frequency,
    ...(reminder
      ? [`vence ${formatDayMonth(reminder.scheduledDate)}`]
      : [
          lastPaidDate && `${isIncome ? "recibida" : "pagada"} ${formatDayMonth(lastPaidDate)}`,
          item.isActive ? `próxima ${formatDayMonth(item.nextScheduledDate)}` : "detenido",
        ]),
  ].filter(Boolean).join(" · ");

  async function run(action) {
    if (busy) return;
    setBusy(true);
    const done = await action();
    if (done) onClose();
    else setBusy(false);
  }

  const header = (
    <div className={styles.header}>
      <span
        className={styles.tile}
        style={color ? { background: color, color: getInkOnColor(color) } : undefined}
        aria-hidden="true"
      >
        <CategoryIcon name={item.category?.icon || "calendar-days"} size={24} />
      </span>
      <div className={styles.heading}>
        <h2 id={titleId} className={styles.title}>{item.concept}</h2>
        <span className={styles.meta}>{meta}</span>
      </div>
      <button type="button" className={styles.close} aria-label="Cerrar" onClick={onClose} disabled={busy}>
        <Icon name="close" size={20} strokeWidth={2} />
      </button>
    </div>
  );

  if (askingScope) {
    return (
      <BottomSheet open onClose={onClose} header={header} labelledBy={titleId} busy={busy}>
        <div className={styles.confirm} role="alert">
          <p className={styles.confirmText}>{cancelQuestion(item, askingScope)}</p>
          <PillButton
            size="cta"
            variant={askingScope === "all" ? "danger" : "primary"}
            block
            disabled={busy}
            onClick={() => run(() => onCancel(item, askingScope))}
            data-autofocus
          >
            {busy ? "Guardando..." : askingScope === "future" ? "Sí, detener futuras" : "Sí, eliminar"}
          </PillButton>
          <div className={styles.secondary}>
            <button type="button" className={styles.textButton} onClick={() => setAskingScope(null)} disabled={busy}>
              Cancelar
            </button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet open onClose={onClose} header={header} labelledBy={titleId} busy={busy}>
      {reminder && (
        <>
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
        </>
      )}

      <div className={cx(styles.secondary, !reminder && styles.secondaryOnly)}>
        {onEdit && (
          <button type="button" className={styles.textButton} onClick={onEdit} disabled={busy}>
            Editar
          </button>
        )}
        {item.isActive && (
          <button type="button" className={styles.textButton} onClick={() => setAskingScope("future")} disabled={busy}>
            Detener futuras
          </button>
        )}
        <button type="button" className={cx(styles.textButton, styles.danger)} onClick={() => setAskingScope("all")} disabled={busy}>
          Eliminar
        </button>
      </div>
    </BottomSheet>
  );
}

export default ConfirmPaymentSheet;
