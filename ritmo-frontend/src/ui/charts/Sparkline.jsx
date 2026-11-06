import { smoothPath } from "./path";
import styles from "./Charts.module.css";

/**
 * Línea de tendencia ("Disponible" en Hoy móvil) con el último punto marcado.
 * values: serie numérica; sin variación se dibuja una línea plana a media altura.
 */
function Sparkline({ values, ariaLabel }) {
  const series = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min;
  const step = 136 / (series.length - 1);
  const points = series.map((value, index) => [
    2 + index * step,
    range === 0 ? 22 : 40 - ((value - min) / range) * 36,
  ]);
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg viewBox="0 0 140 44" role="img" aria-label={ariaLabel} className={styles.spark}>
      <path d={smoothPath(points)} className={styles.sparkLine} />
      <circle cx={lastX} cy={lastY} r="3.5" className={styles.sparkDot} />
    </svg>
  );
}

export default Sparkline;
