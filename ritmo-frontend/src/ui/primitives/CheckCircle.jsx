import Icon from "../icons/Icon";
import cx from "../cx";
import styles from "./CheckCircle.module.css";

/**
 * Check circular para completar tareas, eventos o hábitos.
 * El botón mide 44×44 (área táctil mínima); el círculo visible mide size (26, 28 o 32).
 * Completado = relleno negro con check blanco; nunca tachado.
 */
function CheckCircle({ checked = false, onToggle, label, size = 26, tone = "default", disabled, className }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cx(styles.hit, className)}
    >
      <span
        className={cx(styles.circle, styles[`s${size}`], tone === "pastel" && styles.pastel, checked && styles.checked)}
        aria-hidden="true"
      >
        {checked && <Icon name="check" size={size >= 32 ? 16 : 13} strokeWidth={3} />}
      </span>
    </button>
  );
}

export default CheckCircle;
