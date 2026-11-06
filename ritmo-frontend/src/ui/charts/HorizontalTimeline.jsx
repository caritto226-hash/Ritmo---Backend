import { Link } from "react-router-dom";
import Icon from "../icons/Icon";
import cx from "../cx";
import { formatClock, formatHourLabel } from "../../utils/dates";
import styles from "./HorizontalTimeline.module.css";

const DEFAULT_START = 7;
const DEFAULT_END = 19.5;
const LANE_TOP = 50;
const LANE_GAP = 60;

/**
 * Línea de tiempo horizontal sobre fondo rayado (Agenda del Inicio web).
 * items: [{ key, kind: "task" | "event", title, start, end, lane, done, onToggle?, to?, ariaLabel }].
 * Las tareas son botones que se completan al tocarlas; los eventos enlazan a su módulo.
 * now (horas) dibuja la marca negra de la hora actual. El rango se amplía si algo queda fuera.
 */
function HorizontalTimeline({ items, now = null, emptyText }) {
  const start = Math.min(DEFAULT_START, ...items.map((item) => Math.floor(item.start)));
  const end = Math.max(DEFAULT_END, ...items.map((item) => Math.ceil(item.end)));
  const span = end - start;
  const position = (hours) => (((hours - start) / span) * 100).toFixed(2);
  const hours = [];
  for (let hour = start; hour <= Math.floor(end - 0.5); hour += 1) hours.push(hour);
  const showNow = now !== null && now >= start && now <= end;

  return (
    <div className={styles.scroller}>
      <div className={styles.track}>
        {hours.map((hour) => (
          <div key={hour} className={styles.hour} style={{ left: `${position(hour)}%` }}>
            <span className={styles.hourLabel}>{formatHourLabel(hour)}</span>
          </div>
        ))}

        {showNow && (
          <div className={styles.now} style={{ left: `${position(now)}%` }} aria-hidden="true">
            <span className={styles.nowLabel}>{formatClock(now)}</span>
          </div>
        )}

        {items.map((item) => {
          const isEvent = item.kind === "event";
          const content = (
            <>
              <span className={styles.icon}>
                <Icon
                  name={isEvent ? "calendar" : item.done ? "taskCircle" : "ring"}
                  size={16}
                  strokeWidth={isEvent ? 1.8 : 2}
                />
              </span>
              <span className={styles.title}>{item.title}</span>
              <span className={styles.time}>{formatClock(item.start)} – {formatClock(item.end)}</span>
            </>
          );
          const props = {
            className: cx(styles.item, isEvent ? styles.event : styles.task, item.done && styles.done),
            style: {
              top: LANE_TOP + item.lane * LANE_GAP,
              left: `${position(item.start)}%`,
              width: `${(((item.end - item.start) / span) * 100).toFixed(2)}%`,
            },
            "aria-label": item.ariaLabel,
          };

          return isEvent ? (
            <Link key={item.key} to={item.to} {...props}>{content}</Link>
          ) : (
            <button key={item.key} type="button" onClick={item.onToggle} aria-pressed={item.done} disabled={item.disabled} {...props}>
              {content}
            </button>
          );
        })}

        {items.length === 0 && <div className={styles.empty}>{emptyText}</div>}
      </div>
    </div>
  );
}

export default HorizontalTimeline;
