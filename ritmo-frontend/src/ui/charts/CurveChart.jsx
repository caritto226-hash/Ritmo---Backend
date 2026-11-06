import { smoothPath } from "./path";
import styles from "./Charts.module.css";

const WIDTH = 360;
const BASELINE = 150;
const PLOT_HEIGHT = 112;

/**
 * Curva suave con puntos y etiqueta lima sobre el valor más alto ("Gastos de la semana").
 * values: números (uno por etiqueta); formatTip da el texto de la etiqueta.
 */
function CurveChart({ values, labels, formatTip = String, ariaLabel }) {
  const max = Math.max(...values, 0);
  const step = values.length > 1 ? (WIDTH - 24) / (values.length - 1) : 0;
  const points = values.map((value, index) => [
    12 + index * step,
    BASELINE - (max === 0 ? 0 : (value / max) * PLOT_HEIGHT),
  ]);
  const line = smoothPath(points);
  const last = points[points.length - 1];
  const area = `${line} L${last[0]} 168 L${points[0][0]} 168 Z`;
  const tipIndex = values.indexOf(max);
  const tip = points[tipIndex];

  return (
    <div className={styles.curve}>
      <svg viewBox="0 0 360 170" role="img" aria-label={ariaLabel} className={styles.curveSvg}>
        <path d={area} className={styles.curveArea} />
        <path d={line} className={styles.curveLine} />
        {points.map(([x, y], index) => (
          <circle key={labels[index]} cx={x} cy={y} r="3.5" className={styles.curveDot} />
        ))}
        <rect x={tip[0] - 37} y={tip[1] - 38} width="74" height="26" rx="13" className={styles.curveTip} />
        <text x={tip[0]} y={tip[1] - 21} textAnchor="middle" className={styles.curveTipText}>
          {formatTip(max)}
        </text>
      </svg>
      <div className={styles.curveLabels} style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
        {labels.map((label) => <span key={label}>{label}</span>)}
      </div>
    </div>
  );
}

export default CurveChart;
