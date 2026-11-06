import styles from "./Charts.module.css";

/**
 * Burbuja teal con el valor principal y burbujas de vidrio satélite (Hábitos del Inicio web).
 * main: { value, unit, caption, ariaLabel }.
 * satellites: [{ key, value, caption, ariaLabel, size, valueSize, captionSize, position }];
 * position son las coordenadas del mockup ({ top, bottom, marginLeft }) relativas al centro.
 */
function BubbleStats({ main, satellites = [] }) {
  return (
    <div className={styles.bubbles}>
      <div className={styles.bubbleMain} role="img" aria-label={main.ariaLabel}>
        <span className={styles.bubbleMainValue}>
          {main.value}
          {main.unit && <span className={styles.bubbleMainUnit}>{main.unit}</span>}
        </span>
        <span className={styles.bubbleMainCaption}>{main.caption}</span>
      </div>
      {satellites.map((satellite) => (
        <div
          key={satellite.key}
          className={styles.bubbleGlass}
          role="img"
          aria-label={satellite.ariaLabel}
          style={{ width: satellite.size, height: satellite.size, ...satellite.position }}
        >
          <span className={styles.bubbleGlassValue} style={{ fontSize: satellite.valueSize }}>{satellite.value}</span>
          <span className={styles.bubbleGlassCaption} style={{ fontSize: satellite.captionSize }}>{satellite.caption}</span>
        </div>
      ))}
    </div>
  );
}

export default BubbleStats;
