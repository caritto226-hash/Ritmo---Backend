import IconButton from "../primitives/IconButton";
import cx from "../cx";
import { daysInMonth, formatMonthTitle, makeDateKey, MONTHS, parseDateKey } from "../../utils/dates";
import styles from "./Charts.module.css";

const WEEK_LETTERS = ["L", "M", "X", "J", "V", "S", "D"];

/**
 * Calendario del mes con navegación (semana de lunes a domingo).
 * Hoy en lima, el día elegido en negro y un punto en los días con actividad (markedDates: Set).
 * variant "events" (EventosWeb.dc.html): el mes es el h2 de la tarjeta (titleId), flechas de
 * 40 px y puntos teal; markedLabel dice qué marca el punto.
 */
function MonthMini({
  year,
  month,
  selectedKey,
  todayKey,
  markedDates,
  onSelect,
  onPrev,
  onNext,
  variant = "default",
  titleId,
  markedLabel = "con actividades",
}) {
  const firstWeekday = parseDateKey(makeDateKey(year, month, 1)).weekday;
  const leading = (firstWeekday + 6) % 7;
  const days = Array.from({ length: daysInMonth(year, month) }, (_, index) => index + 1);
  const isEvents = variant === "events";
  const navSize = isEvents ? 40 : 36;

  return (
    <>
      <div className={styles.monthHeader}>
        {isEvents ? (
          <h2 id={titleId} className={styles.monthTitleCard}>{formatMonthTitle(year, month)}</h2>
        ) : (
          <span className={styles.monthTitle}>{formatMonthTitle(year, month)}</span>
        )}
        <div className={styles.monthNav}>
          <IconButton icon="chevronLeft" label="Mes anterior" size={navSize} iconSize={14} variant="soft" strokeWidth={2} onClick={onPrev} />
          <IconButton icon="chevronRight" label="Mes siguiente" size={navSize} iconSize={14} variant="soft" strokeWidth={2} onClick={onNext} />
        </div>
      </div>
      <div className={cx(styles.monthGrid, isEvents && styles.monthEvents)}>
        {WEEK_LETTERS.map((letter) => (
          <span key={letter} className={styles.monthWeekday} aria-hidden="true">{letter}</span>
        ))}
        {Array.from({ length: leading }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
        {days.map((day) => {
          const key = makeDateKey(year, month, day);
          const selected = key === selectedKey;
          const marked = markedDates.has(key);
          return (
            <button
              key={key}
              type="button"
              className={styles.monthCell}
              aria-pressed={selected}
              aria-label={`${day} de ${MONTHS[month]}${marked ? `, ${markedLabel}` : ""}${key === todayKey ? ", hoy" : ""}`}
              onClick={() => onSelect(key)}
            >
              <span className={cx(styles.monthDay, key === todayKey && styles.monthToday, selected && styles.monthSelected)}>{day}</span>
              <span className={cx(styles.monthDot, marked && (selected ? styles.monthDotSelected : styles.monthDotOn))} />
            </button>
          );
        })}
      </div>
    </>
  );
}

export default MonthMini;
