import styles from "./Charts.module.css";

// Longitud del semicírculo (r = 50).
const ARC_LENGTH = 157;

/**
 * Medio medidor teal (Tareas en Hoy móvil). ratio de 0 a 1; value y caption van al centro.
 */
function HalfGauge({ ratio, value, caption, ariaLabel }) {
  const dash = (Math.max(0, Math.min(1, ratio)) * ARC_LENGTH).toFixed(1);

  return (
    <div className={styles.gauge} role="img" aria-label={ariaLabel}>
      <svg viewBox="0 0 120 66" aria-hidden="true" className={styles.gaugeSvg}>
        <path d="M10 60 A50 50 0 0 1 110 60" className={styles.gaugeTrack} />
        {ratio > 0 && (
          <path d="M10 60 A50 50 0 0 1 110 60" className={styles.gaugeArc} strokeDasharray={`${dash} 160`} />
        )}
      </svg>
      <div className={styles.gaugeCenter}>
        <span className={styles.gaugeValue}>{value}</span>
        <span className={styles.gaugeCaption}>{caption}</span>
      </div>
    </div>
  );
}

export default HalfGauge;
