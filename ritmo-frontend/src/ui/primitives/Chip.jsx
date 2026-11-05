import cx from "../cx";
import styles from "./Chip.module.css";

/**
 * Chip conmutable (aria-pressed). variant: filter (web) | mobile | category (con punto).
 * dotColor recibe el color guardado de la categoría o un token: "var(--teal)".
 */
function Chip({ variant = "filter", selected = false, dotColor, className, children, ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(styles.chip, styles[variant], className)}
      {...rest}
    >
      {dotColor && <span className={styles.dot} style={{ "--chip-dot": dotColor }} aria-hidden="true" />}
      {children}
    </button>
  );
}

export default Chip;
