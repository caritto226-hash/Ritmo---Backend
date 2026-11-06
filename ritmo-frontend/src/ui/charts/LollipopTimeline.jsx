import cx from "../cx";
import { formatClock, formatHourLabel } from "../../utils/dates";
import styles from "./Charts.module.css";

const DAY_START = 7;
const DAY_END = 20;
const AXIS_LABELS = [7, 12, 17, 20];

/**
 * "Tu día" (Hoy móvil): pirulís por actividad sobre una línea de 7 a. m. a 8 p. m.
 * pins: [{ key, hours, kind: "event" | "task", done }]. now (horas) dibuja la línea punteada.
 */
function LollipopTimeline({ pins, now = null, ariaLabel }) {
  const clamp = (hours) => Math.max(DAY_START, Math.min(DAY_END, hours));
  const position = (hours) => (((clamp(hours) - DAY_START) / (DAY_END - DAY_START)) * 100).toFixed(2);
  const ticks = [];
  for (let hour = DAY_START; hour <= DAY_END; hour += 1) ticks.push(hour);
  const showNow = now !== null && now >= DAY_START && now <= DAY_END;

  return (
    <div className={styles.lollipop} role="img" aria-label={ariaLabel}>
      {ticks.map((hour) => (
        <span
          key={hour}
          className={styles.lollipopTick}
          style={{ left: `${position(hour)}%`, height: hour % 5 === 2 ? 10 : 5 }}
        />
      ))}
      <span className={styles.lollipopAxis} />
      {pins.map((pin, index) => {
        const height = 34 + (index % 3) * 22 + (pin.kind === "event" ? 10 : 0);
        const tone = pin.done ? styles.pinDone : pin.kind === "event" ? styles.pinEvent : styles.pinTask;
        return (
          <span key={pin.key}>
            <span className={cx(styles.pinStem, tone)} style={{ left: `${position(pin.hours)}%`, height }} />
            <span className={cx(styles.pinDot, tone)} style={{ left: `${position(pin.hours)}%`, bottom: 22 + height - 7 }} />
          </span>
        );
      })}
      {showNow && (
        <>
          <span className={styles.lollipopNow} style={{ left: `${position(now)}%` }} />
          <span className={styles.lollipopNowLabel} style={{ left: `${position(now)}%` }}>{formatClock(now)}</span>
        </>
      )}
      <div className={styles.lollipopAxisLabels}>
        {AXIS_LABELS.map((hour) => <span key={hour}>{formatHourLabel(hour)}</span>)}
      </div>
    </div>
  );
}

export default LollipopTimeline;
