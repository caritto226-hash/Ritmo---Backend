import cx from "../cx";
import { formatLongDate, parseDateKey } from "../../utils/dates";
import styles from "./WeekStrip.module.css";

const LETTERS = ["D", "L", "M", "M", "J", "V", "S"];

/**
 * Tira de 7 días (Tareas móvil). days: claves "YYYY-MM-DD" de domingo a sábado.
 * El día elegido va en negro, hoy en lima y un punto marca los días con actividad (markedDates: Set).
 */
function WeekStrip({ days, selectedKey, todayKey, markedDates, onSelect, markedLabel = "con tareas" }) {
  return (
    <div className={styles.strip}>
      {days.map((key) => {
        const selected = key === selectedKey;
        const marked = markedDates.has(key);
        const { day, weekday } = parseDateKey(key);
        return (
          <button
            key={key}
            type="button"
            className={styles.day}
            aria-pressed={selected}
            aria-label={`${formatLongDate(key)}${marked ? `, ${markedLabel}` : ""}${key === todayKey ? ", hoy" : ""}`}
            onClick={() => onSelect(key)}
          >
            <span className={styles.letter} aria-hidden="true">{LETTERS[weekday]}</span>
            <span className={cx(styles.number, key === todayKey && styles.today, selected && styles.selected)} aria-hidden="true">
              {day}
            </span>
            <span className={cx(styles.dot, marked && styles.dotOn)} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

export default WeekStrip;
