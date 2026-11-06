import Icon from "../icons/Icon";
import cx from "../cx";
import styles from "./ReminderLine.module.css";

/**
 * Línea de "Recordatorios de hoy" (HabitosWeb.dc.html): pista rayada, avance hasta ahora y un
 * punto con gota por recordatorio. points: [{ key, left (%), label, above, state, ariaLabel }],
 * state: done (pasó y se cumplió) | missed (pasó sin cumplir) | upcoming. progress: % de la pista.
 */
function ReminderLine({ points, progress, ariaLabel, emptyText }) {
  return (
    <div role="img" aria-label={ariaLabel} className={styles.track}>
      <span className={styles.line} />
      <span className={styles.progress} style={{ width: `${progress}%` }} />
      {points.map((point) => (
        <span key={point.key}>
          <span className={cx(styles.point, styles[point.state])} style={{ left: `${point.left}%` }}>
            <Icon name="drop" size={13} strokeWidth={2} />
          </span>
          <span className={cx(styles.label, point.above && styles.above)} style={{ left: `${point.left}%` }}>
            {point.label}
          </span>
        </span>
      ))}
      {points.length === 0 && emptyText && <span className={styles.empty}>{emptyText}</span>}
    </div>
  );
}

export default ReminderLine;
