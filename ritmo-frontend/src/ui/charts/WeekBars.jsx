import cx from "../cx";
import styles from "./WeekBars.module.css";

const BASE_HEIGHT = 30;
const UNIT = 16;
const MAX_UNITS = 6;

/**
 * Barras por día de la semana ("Esta semana" de Tareas web).
 * days: [{ key, label, count, isToday }]. Hoy va en lima con su cifra encima.
 * Cada unidad suma 16 px sobre una base de 30, como el mockup; si un día pasa de 6,
 * la escala se reduce para que la barra más alta mida lo mismo que 6.
 */
function WeekBars({ days, ariaLabel }) {
  const max = Math.max(...days.map((day) => day.count));
  const unit = max > MAX_UNITS ? (UNIT * MAX_UNITS) / max : UNIT;

  return (
    <div className={styles.bars} role="img" aria-label={ariaLabel}>
      {days.map((day) => (
        <div key={day.key} className={styles.column} aria-hidden="true">
          {day.isToday && <span className={styles.badge}>{day.count}</span>}
          <span className={cx(styles.bar, day.isToday && styles.today)} style={{ height: BASE_HEIGHT + day.count * unit }} />
          <span className={styles.day}>{day.label}</span>
        </div>
      ))}
    </div>
  );
}

export default WeekBars;
