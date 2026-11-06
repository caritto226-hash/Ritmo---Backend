import { Link } from "react-router-dom";
import Icon from "../icons/Icon";
import cx from "../cx";
import { getInkOnColor } from "../../utils/color";
import { formatClock, formatHourLabel } from "../../utils/dates";
import styles from "./HorizontalTimeline.module.css";

// agenda: Inicio.dc.html · tasks: TareasWeb.dc.html ("Tu horario de hoy")
const VARIANTS = {
  agenda: { start: 7, end: 19.5, laneTop: 50, laneGap: 60 },
  tasks: { start: 7, end: 19, laneTop: 50, laneGap: 58 },
};

/**
 * Línea de tiempo horizontal sobre fondo rayado.
 * items: [{ key, kind: "task" | "event", title, start, end, lane, done, onToggle?, to?, ariaLabel }].
 * Las tareas son botones que se completan al tocarlas; los eventos enlazan a su módulo.
 * now (horas) dibuja la marca negra de la hora actual. El rango se amplía si algo queda fuera.
 * variant "tasks": el círculo del ícono toma el color de la categoría (item.color), la tarea en
 * curso (item.hot) va en negro con el círculo lima y la completada en gris con check negro.
 */
function HorizontalTimeline({ items, now = null, emptyText, variant = "agenda" }) {
  const config = VARIANTS[variant];
  const isTasks = variant === "tasks";
  const start = Math.min(config.start, ...items.map((item) => Math.floor(item.start)));
  const end = Math.max(config.end, ...items.map((item) => Math.ceil(item.end)));
  const span = end - start;
  const position = (hours) => (((hours - start) / span) * 100).toFixed(2);
  const hours = [];
  // La última hora no lleva marca: su etiqueta quedaría fuera de la pista y forzaría scroll.
  for (let hour = start; hour <= Math.ceil(end) - 1; hour += 1) hours.push(hour);
  const showNow = now !== null && now >= start && now <= end;

  function iconFor(item) {
    if (item.kind === "event") return "calendar";
    if (isTasks) return item.done ? "check" : "dot";
    return item.done ? "taskCircle" : "ring";
  }

  return (
    <div className={styles.scroller}>
      <div className={cx(styles.track, isTasks && styles.trackTasks)}>
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
          const tinted = isTasks && !item.done && !item.hot && item.color;
          const content = (
            <>
              <span
                className={styles.icon}
                style={tinted ? { "--item-tint": item.color, "--item-ink": getInkOnColor(item.color) } : undefined}
              >
                <Icon name={iconFor(item)} size={16} strokeWidth={isEvent ? 1.8 : isTasks ? 2.2 : 2} />
              </span>
              <span className={styles.title}>{item.title}</span>
              <span className={styles.time}>{formatClock(item.start)} – {formatClock(item.end)}</span>
            </>
          );
          const props = {
            className: cx(
              styles.item,
              isEvent ? styles.event : styles.task,
              isTasks && styles.taskVariant,
              item.done && styles.done,
              isTasks && item.hot && styles.hot,
            ),
            style: {
              top: config.laneTop + item.lane * config.laneGap,
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
