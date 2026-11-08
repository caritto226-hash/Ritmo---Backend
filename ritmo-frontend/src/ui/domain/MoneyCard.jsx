import Icon from "../icons/Icon";
import CategoryIcon from "../../components/CategoryIcon";
import cx from "../cx";
import { formatCurrency, frequencyLabels } from "../../utils/financeFormat";
import { describeReminder } from "./reminderDisplay";
import styles from "./MoneyCard.module.css";

/**
 * Pago o cobro pendiente con el botón ✓ (abre la hoja de confirmación).
 * variant "card" (tarjeta de 200 px del mockup), "compact" (164 px, carrusel del Inicio web),
 * "row" (fila de Hoy móvil), "pendingWeb" (Por confirmar de FinanzasWeb.dc.html: 236 px con
 * inicial, monto con signo y botón "Pagado" / "Recibido") o "pendingMobile" (carrusel de
 * Finanzas.dc.html: 236 px con el ícono de la categoría, vencimiento · frecuencia y monto sin signo).
 * El color de la ficha es el de la categoría, tal cual; la inicial o el ícono usan la tinta que contrasta.
 */
function MoneyCard({ reminder, variant = "card", today, onSettle }) {
  const view = describeReminder(reminder, today);

  if (variant === "pendingWeb" || variant === "pendingMobile") {
    const isWeb = variant === "pendingWeb";
    const frequency = frequencyLabels[reminder.frequency] || reminder.frequency;
    return (
      <div className={cx(styles.pending, isWeb ? styles.pendingWeb : styles.pendingMobile, view.late && styles.late)}>
        <div className={styles.lead}>
          <span className={styles.tile} style={view.tileStyle} aria-hidden="true">
            {isWeb ? view.initial : <CategoryIcon name={reminder.category?.icon || "calendar-days"} size={20} />}
          </span>
          <span className={styles.copy}>
            <span className={styles.name}>{view.name}</span>
            <span className={cx(styles.due, view.late && styles.dueLate)}>
              {isWeb || !frequency ? view.due : `${view.due} · ${frequency}`}
            </span>
          </span>
        </div>
        <div className={styles.trail}>
          <span className={cx(styles.amount, view.isIncome && styles.income)}>
            {isWeb ? view.amount : formatCurrency(Math.abs(Number(reminder.amount)))}
          </span>
          <button type="button" className={styles.settlePill} aria-label={view.settleLabel} onClick={() => onSettle(reminder)}>
            <Icon name="check" size={isWeb ? 14 : 16} strokeWidth={isWeb ? 2.4 : 2.6} />
            {view.isIncome ? "Recibido" : "Pagado"}
          </button>
        </div>
      </div>
    );
  }

  const isRow = variant === "row";
  const isCompact = variant === "compact";

  return (
    <div className={cx(isRow ? styles.row : styles.card, isCompact && styles.compact, !isRow && view.late && styles.late)}>
      <div className={styles.lead}>
        <span className={styles.tile} style={view.tileStyle} aria-hidden="true">{view.initial}</span>
        <span className={styles.copy}>
          <span className={styles.name}>{view.name}</span>
          <span className={cx(styles.due, view.late && styles.dueLate)}>{view.due}</span>
        </span>
      </div>
      <div className={styles.trail}>
        <span className={cx(styles.amount, view.isIncome && styles.income)}>{view.amount}</span>
        <button type="button" className={styles.settle} aria-label={view.settleLabel} onClick={() => onSettle(reminder)}>
          <Icon name="check" size={isRow || isCompact ? 15 : 16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

export default MoneyCard;
