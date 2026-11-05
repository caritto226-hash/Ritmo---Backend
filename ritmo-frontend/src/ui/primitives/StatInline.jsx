import { NO_DATA } from "../designPreview";
import cx from "../cx";
import styles from "./StatInline.module.css";

/**
 * Cifra resumen junto al título ("5 · +1 Días de racha").
 * deltaTone: positive | negative | strong | neutral. Si value o delta llegan en null
 * (dato que no existe en la API) se muestra "—" en lugar de inventar un valor.
 */
function StatInline({ value, delta, deltaTone = "strong", label, className }) {
  const deltaMissing = delta === null;

  return (
    <div className={cx(styles.stat, className)}>
      <span className={styles.value}>{value ?? NO_DATA}</span>
      <span className={styles.side}>
        {delta !== undefined && (
          <span className={cx(styles.delta, deltaMissing ? styles.empty : styles[deltaTone])}>
            {deltaMissing ? NO_DATA : delta}
          </span>
        )}
        <span className={styles.label}>{label}</span>
      </span>
    </div>
  );
}

export default StatInline;
