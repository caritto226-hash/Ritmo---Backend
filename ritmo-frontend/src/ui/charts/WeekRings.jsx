import NoData from "../primitives/NoData";
import cx from "../cx";
import styles from "./WeekRings.module.css";

const CIRCUMFERENCE = 125.7;

/**
 * Semana con anillos de Hábitos móvil (Habitos.dc.html): letra, número del día y un anillo que
 * avanza con el % cumplido. days: [{ key, letter, number, value (0–1, null = sin datos), today, ariaLabel }].
 * Hoy va relleno en negro. noData muestra "Próximamente" debajo.
 */
function WeekRings({ days, noData = false }) {
  return (
    <div className={styles.wrap}>
      <ul className={styles.week} aria-label="Esta semana">
        {days.map((day) => (
          <li key={day.key} className={styles.day} aria-label={day.ariaLabel}>
            <span className={styles.letter} aria-hidden="true">{day.letter}</span>
            <span className={styles.ring} aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 44 44" className={styles.svg}>
                <circle cx="22" cy="22" r="20" strokeWidth="3" className={cx(styles.track, day.today && styles.trackToday)} />
                {day.value > 0 && (
                  <circle
                    cx="22"
                    cy="22"
                    r="20"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className={styles.value}
                    strokeDasharray={`${(day.value * CIRCUMFERENCE).toFixed(1)} 126`}
                  />
                )}
              </svg>
              <span className={cx(styles.number, day.today && styles.numberToday)}>{day.number}</span>
            </span>
          </li>
        ))}
      </ul>
      {noData && <NoData className={styles.noData} />}
    </div>
  );
}

export default WeekRings;
