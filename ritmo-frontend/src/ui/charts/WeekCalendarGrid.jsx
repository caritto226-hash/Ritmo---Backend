import { useLayoutEffect, useRef } from "react";
import cx from "../cx";
import { getInkOnColor } from "../../utils/color";
import { formatHourLabel } from "../../utils/dates";
import styles from "./WeekCalendarGrid.module.css";

const HOUR_HEIGHT = 50;
const MIN_BLOCK = 40;
const FALLBACK_COLOR = "var(--lav-grey)";

function tintStyle(item) {
  if (item.done || item.canceled) return undefined;
  const color = item.color || FALLBACK_COLOR;
  return { "--block-bg": color, "--block-ink": getInkOnColor(item.color) };
}

/**
 * Calendario por columnas de día (EventosWeb.dc.html): semana (7 columnas) o día (1).
 * days: [{ key, label ("Lun"), number, today, selected, timed, allDay }].
 *   timed: [{ key, title, range, start, end, column, columns, done, canceled, selected, color, onSelect, ariaLabel }]
 *   (column/columns reparten en carriles los bloques que se solapan).
 *   allDay: [{ key, title, done, canceled, selected, color, onSelect, ariaLabel }] van en una franja arriba.
 * startHour / endHour: rango visible; now (horas) dibuja la marca negra en la columna de hoy.
 * Completado = gris con texto --text-done, nunca tachado. Cancelado = sin color, borde punteado
 * y texto --text-done (range dice "Cancelado"), sin tachar. El elegido lleva el anillo negro.
 * La rejilla tiene un ancho mínimo (minWidth) y se desplaza en horizontal si no cabe: al cambiar
 * de semana se desplaza sola hasta que se vea la columna focusKey (hoy o el día elegido).
 */
function WeekCalendarGrid({ days, startHour, endHour, now = null, minWidth, emptyText, focusKey }) {
  const scrollerRef = useRef(null);
  const firstKey = days[0]?.key;

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const column = focusKey && scroller?.querySelector(`[data-day="${focusKey}"]`);
    if (!column) return;
    const view = scroller.getBoundingClientRect();
    const target = column.getBoundingClientRect();
    if (target.right > view.right) scroller.scrollLeft += target.right - view.right;
    else if (target.left < view.left) scroller.scrollLeft -= view.left - target.left;
  }, [focusKey, firstKey, days.length]);

  const gridHeight = (endHour - startHour) * HOUR_HEIGHT;
  const hours = [];
  for (let hour = startHour; hour <= endHour; hour += 1) hours.push(hour);
  const showNow = now !== null && now >= startHour && now <= endHour;
  const hasAllDay = days.some((day) => day.allDay.length > 0);
  const isEmpty = days.every((day) => day.timed.length === 0 && day.allDay.length === 0);

  return (
    <div ref={scrollerRef} className={styles.scroller}>
      <div
        className={styles.grid}
        style={{ minWidth, gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <span />
        {days.map((day) => (
          <div key={day.key} className={styles.head}>
            <span className={styles.weekday}>{day.label}</span>
            <span className={cx(styles.number, day.today && styles.today, day.selected && styles.selected)}>{day.number}</span>
          </div>
        ))}

        {hasAllDay && (
          <>
            <span className={styles.allDayLabel}>Todo el día</span>
            {days.map((day) => (
              <div key={day.key} className={styles.allDayCell}>
                {day.allDay.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={cx(styles.allDay, item.done && styles.done, item.canceled && styles.canceled)}
                    style={tintStyle(item)}
                    aria-pressed={item.selected}
                    aria-label={item.ariaLabel}
                    onClick={item.onSelect}
                  >
                    <span className={styles.allDayTitle}>{item.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </>
        )}

        <div className={styles.hours} style={{ height: gridHeight }} aria-hidden="true">
          {hours.map((hour) => (
            <span key={hour} className={styles.hourLabel} style={{ top: (hour - startHour) * HOUR_HEIGHT }}>
              {formatHourLabel(hour)}
            </span>
          ))}
        </div>

        {days.map((day) => (
          <div key={day.key} data-day={day.key} className={cx(styles.column, day.today && styles.columnToday)} style={{ height: gridHeight }}>
            {hours.map((hour) => (
              <span key={hour} className={styles.line} style={{ top: (hour - startHour) * HOUR_HEIGHT }} />
            ))}
            {day.today && showNow && (
              <span className={styles.now} style={{ top: (now - startHour) * HOUR_HEIGHT }} aria-hidden="true">
                <span className={styles.nowDot} />
              </span>
            )}
            {day.timed.map((item) => (
              <button
                key={item.key}
                type="button"
                className={cx(styles.block, item.done && styles.done, item.canceled && styles.canceled)}
                style={{
                  ...tintStyle(item),
                  "--block-column": item.column,
                  "--block-columns": item.columns,
                  top: (item.start - startHour) * HOUR_HEIGHT + 2,
                  height: Math.max((item.end - item.start) * HOUR_HEIGHT - 4, MIN_BLOCK),
                }}
                aria-pressed={item.selected}
                aria-label={item.ariaLabel}
                onClick={item.onSelect}
              >
                <span className={styles.blockBody}>
                  <span className={styles.blockTitle}>{item.title}</span>
                  <span className={styles.blockRange}>{item.range}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
      {isEmpty && emptyText && <p className={styles.empty}>{emptyText}</p>}
    </div>
  );
}

export default WeekCalendarGrid;
