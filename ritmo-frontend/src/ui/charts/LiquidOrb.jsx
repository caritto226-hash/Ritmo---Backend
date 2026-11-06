import { useId } from "react";
import cx from "../cx";
import styles from "./LiquidOrb.module.css";

// Circunferencia del anillo de avance (r = 77 en el viewBox de 160).
const RING_LENGTH = 483.8;

/**
 * Esfera líquida de "Tu ritmo de hoy" (Inicio.dc.html / Hoy.dc.html).
 * El nivel sube y el anillo avanza con pct; el oleaje se detiene con prefers-reduced-motion.
 * size "web" (200 px) o "mobile" (150 px).
 */
function LiquidOrb({ pct, label, size = "web", className }) {
  const id = useId().replace(/:/g, "");
  const clipId = `orb-clip-${id}`;
  const liquidId = `orb-liquid-${id}`;
  const safePct = Math.max(0, Math.min(100, pct));
  const level = (150 - (safePct / 100) * 140).toFixed(1);
  const dash = ((safePct / 100) * RING_LENGTH).toFixed(1);

  return (
    <div className={cx(styles.orb, styles[size], className)} role="img" aria-label={`Avance del día: ${safePct}%, ${label}`}>
      <svg className={styles.svg} viewBox="0 0 160 160" aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <circle cx="80" cy="80" r="70" />
          </clipPath>
          <linearGradient id={liquidId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={styles.stopTop} />
            <stop offset="0.55" className={styles.stopMid} />
            <stop offset="1" className={styles.stopBottom} />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r="70" className={styles.glass} />
        <g clipPath={`url(#${clipId})`}>
          <g className={styles.level} style={{ transform: `translateY(${level}px)` }}>
            <g className={styles.wave2}>
              <path className={styles.backWave} d="M0 4 Q20 -2 40 4 T80 4 T120 4 T160 4 T200 4 T240 4 T280 4 T320 4 V200 H0 Z" />
            </g>
            <g className={styles.wave}>
              <path fill={`url(#${liquidId})`} d="M0 0 Q20 -7 40 0 T80 0 T120 0 T160 0 T200 0 T240 0 T280 0 T320 0 V200 H0 Z" />
            </g>
          </g>
        </g>
        <circle cx="80" cy="80" r="70" className={styles.rim} />
        <ellipse cx="58" cy="40" rx="20" ry="10" className={styles.shine} transform="rotate(-30 58 40)" />
        {/* En 0 % no se dibuja: el extremo redondeado de un trazo vacío deja un punto. */}
        {safePct > 0 && (
          <circle
            cx="80"
            cy="80"
            r="77"
            className={styles.ring}
            strokeDasharray={`${dash} 484`}
            transform="rotate(-90 80 80)"
          />
        )}
      </svg>
      <div className={styles.center}>
        <span className={styles.pct}>
          {safePct}
          <span className={styles.sign}>%</span>
        </span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}

export default LiquidOrb;
