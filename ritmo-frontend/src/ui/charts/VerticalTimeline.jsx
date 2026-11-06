import CheckCircle from "../primitives/CheckCircle";
import cx from "../cx";
import { getInkOnColor } from "../../utils/color";
import { formatClock, formatHourLabel } from "../../utils/dates";
import styles from "./VerticalTimeline.module.css";

const DEFAULT_START = 7;
const DEFAULT_END = 18;
const HOUR_HEIGHT = 56;
const MIN_BLOCK = 52;
const FALLBACK_COLOR = "var(--lav-grey)";

// Columnas para bloques que se solapan: cada grupo que se cruza se reparte en carriles
// del mismo ancho (el mockup no dibuja solapes; así ningún bloque tapa a otro).
function layoutColumns(items) {
  const sorted = [...items].sort((a, b) => a.start - b.start);
  const placed = [];
  let cluster = [];
  let clusterEnd = -Infinity;

  function closeCluster() {
    const columns = Math.max(1, ...cluster.map((entry) => entry.column + 1));
    cluster.forEach((entry) => placed.push({ ...entry, columns }));
    cluster = [];
  }

  sorted.forEach((item) => {
    if (item.start >= clusterEnd && cluster.length > 0) closeCluster();
    const taken = new Set(cluster.filter((entry) => entry.end > item.start).map((entry) => entry.column));
    let column = 0;
    while (taken.has(column)) column += 1;
    cluster.push({ ...item, column });
    clusterEnd = Math.max(clusterEnd, item.end);
  });
  if (cluster.length > 0) closeCluster();
  return placed;
}

/**
 * Línea de tiempo vertical del día (Tareas móvil): una fila por hora y bloques pastel con rayas.
 * items: [{ key, title, meta, start, end, done, color, onToggle, onOpen, disabled, toggleLabel, openLabel }].
 * El color es el de la categoría (tal cual); completado = gris, sin rayas, check negro.
 * now (horas) dibuja la línea negra de la hora actual.
 */
function VerticalTimeline({ items, now = null, emptyText }) {
  const start = Math.min(DEFAULT_START, ...items.map((item) => Math.floor(item.start)));
  const end = Math.max(DEFAULT_END, ...items.map((item) => Math.ceil(item.end)));
  const hours = [];
  for (let hour = start; hour <= end; hour += 1) hours.push(hour);
  const showNow = now !== null && now >= start && now <= end;

  return (
    <div className={styles.timeline} style={{ height: (end - start) * HOUR_HEIGHT + 20 }}>
      {hours.map((hour) => (
        <div key={hour} className={styles.hour} style={{ top: (hour - start) * HOUR_HEIGHT }}>
          <span className={styles.hourLabel}>{formatHourLabel(hour)}</span>
          <span className={styles.hourLine} />
        </div>
      ))}

      {showNow && (
        <div className={styles.now} style={{ top: (now - start) * HOUR_HEIGHT }} aria-hidden="true">
          <span className={styles.nowDot} />
        </div>
      )}

      {layoutColumns(items).map((item) => {
        const color = item.color || FALLBACK_COLOR;
        return (
          <div
            key={item.key}
            className={cx(styles.block, item.done && styles.done)}
            style={{
              "--block-tint": color,
              "--block-ink": item.done ? undefined : getInkOnColor(item.color),
              "--block-column": item.column,
              "--block-columns": item.columns,
              top: (item.start - start) * HOUR_HEIGHT + 4,
              height: Math.max((item.end - item.start) * HOUR_HEIGHT - 8, MIN_BLOCK),
            }}
          >
            <button type="button" className={styles.open} onClick={item.onOpen} aria-label={item.openLabel}>
              <span className={styles.title}>{item.title}</span>
              {item.meta && <span className={styles.meta}>{item.meta}</span>}
            </button>
            <span className={styles.time}>{formatClock(item.start)}–{formatClock(item.end)}</span>
            <CheckCircle
              size={32}
              tone="pastel"
              checked={item.done}
              onToggle={item.onToggle}
              label={item.toggleLabel}
              disabled={item.disabled}
            />
          </div>
        );
      })}

      {items.length === 0 && emptyText && <p className={styles.empty}>{emptyText}</p>}
    </div>
  );
}

export default VerticalTimeline;
