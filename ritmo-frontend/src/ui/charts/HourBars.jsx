import NoData from "../primitives/NoData";
import cx from "../cx";
import styles from "./Charts.module.css";

const EMPTY_BARS = Array.from({ length: 12 }, () => ({ height: 10, state: "future" }));

/**
 * Barras por hora: pasada gris, actual lima con brillo y futura rayada.
 * bars: [{ height (0–100), state: "past" | "current" | "future" }].
 * Sin bars (la API no guarda la hora de completado, BACKEND_PENDIENTE #5) se dibuja la pista
 * vacía con la etiqueta "Próximamente", en el mismo tamaño y lugar.
 */
function HourBars({ bars, ariaLabel }) {
  const empty = !bars;
  const list = bars || EMPTY_BARS;

  return (
    <div className={styles.hourBars} role="img" aria-label={empty ? "Actividad por horas: próximamente" : ariaLabel}>
      {!empty && (
        <svg viewBox="0 0 150 60" preserveAspectRatio="none" aria-hidden="true" className={styles.hourTrend}>
          <path d="M2 54 C 30 52, 50 46, 70 34 S 110 8, 148 4" className={styles.hourTrendLine} />
          <circle cx="24" cy="52" r="3.5" className={styles.hourTrendDot} />
          <circle cx="104" cy="16" r="3.5" className={styles.hourTrendDot} />
        </svg>
      )}
      <div className={styles.hourRow} aria-hidden="true">
        {list.map((bar, index) => (
          <span key={index} className={cx(styles.hourBar, styles[bar.state])} style={{ height: `${bar.height}%` }} />
        ))}
      </div>
      {empty && <NoData className={styles.hourNoData} />}
    </div>
  );
}

export default HourBars;
