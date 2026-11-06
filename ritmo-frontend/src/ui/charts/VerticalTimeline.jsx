import CheckCircle from "../primitives/CheckCircle";
import cx from "../cx";
import { getInkOnColor } from "../../utils/color";
import { formatClock, formatHourLabel } from "../../utils/dates";
import layoutColumns from "./layoutColumns";
import styles from "./VerticalTimeline.module.css";

const DEFAULT_START = 7;
const DEFAULT_END = 18;
const HOUR_HEIGHT = 56;
const MIN_BLOCK = 52;
const FALLBACK_COLOR = "var(--lav-grey)";

/**
 * Línea de tiempo vertical del día (Tareas y Eventos móvil): una fila por hora y bloques pastel
 * con rayas. items: [{ key, title, meta, start, end, done, canceled, color, onToggle, onOpen,
 * disabled, toggleLabel, openLabel }]. El color es el de la categoría (tal cual); completado =
 * gris, sin rayas, check negro. Cancelado (Eventos) = sin color, borde punteado, "Cancelado" en
 * lugar de la hora y sin check (se restaura desde el detalle). now (horas) dibuja la línea negra de la hora actual. startHour y endHour
 * fijan el rango mínimo (Tareas 7–18, Eventos 7–20); se amplía si un bloque queda fuera.
 */
function VerticalTimeline({ items, now = null, emptyText, startHour = DEFAULT_START, endHour = DEFAULT_END }) {
  const start = Math.min(startHour, ...items.map((item) => Math.floor(item.start)));
  const end = Math.max(endHour, ...items.map((item) => Math.ceil(item.end)));
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
            className={cx(styles.block, item.done && styles.done, item.canceled && styles.canceled)}
            style={{
              "--block-tint": color,
              "--block-ink": item.done || item.canceled ? undefined : getInkOnColor(item.color),
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
            <span className={styles.time}>
              {item.canceled ? "Cancelado" : `${formatClock(item.start)}–${formatClock(item.end)}`}
            </span>
            {item.canceled ? (
              <span className={styles.checkSpace} aria-hidden="true" />
            ) : (
              <CheckCircle
                size={32}
                tone="pastel"
                checked={item.done}
                onToggle={item.onToggle}
                label={item.toggleLabel}
                disabled={item.disabled}
              />
            )}
          </div>
        );
      })}

      {items.length === 0 && emptyText && <p className={styles.empty}>{emptyText}</p>}
    </div>
  );
}

export default VerticalTimeline;
