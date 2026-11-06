import Icon from "../icons/Icon";
import cx from "../cx";
import { describeReminder } from "./reminderDisplay";
import styles from "./MoneyCard.module.css";

/**
 * Pago o cobro pendiente con el botón ✓ (abre la hoja de confirmación).
 * variant "card" (tarjeta de 200 px del Inicio web) o "row" (fila de Hoy móvil).
 * El color de la ficha es el de la categoría, tal cual; la inicial usa la tinta que contrasta.
 */
function MoneyCard({ reminder, variant = "card", today, onSettle }) {
  const view = describeReminder(reminder, today);
  const isRow = variant === "row";

  return (
    <div className={cx(isRow ? styles.row : styles.card, !isRow && view.late && styles.late)}>
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
          <Icon name="check" size={isRow ? 15 : 16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

export default MoneyCard;
