import CategoryIcon from "../../components/CategoryIcon";
import Icon from "../icons/Icon";
import cx from "../cx";
import styles from "./HabitRow.module.css";

/**
 * Burbuja de hábito móvil (Habitos.dc.html), 76 px de alto, con vidrio y rayas, según el tipo:
 * - Solo marcar (progress null): el check de 32 px (onToggle).
 * - Cantidad: la burbuja se llena (fillTint pinta la parte cumplida), la cifra "4/8" (con texto
 *   libre, "3/8 tazas") abre la hoja de avance (onAdjust) y el botón negro suma uno (onIncrement).
 * - Tiempo: igual, con la cifra "15/30 min" y el botón negro del reloj, que abre la hoja (onAdjust).
 * Cumplido (cantidad o tiempo): el botón pasa a check negro y onToggle vuelve a 0.
 * progress: { type, count, goal, unitLabel, unitOne, inlineUnit }.
 * offDay: no toca hoy; gris, sin botón y "No toca hoy" en la meta (Hábitos v2, decisión 8).
 * Completado = gris con check negro, sin rayas. Tocar el nombre abre el detalle (onOpen).
 */
function HabitRow({
  name,
  meta,
  icon,
  tint,
  fillTint,
  done = false,
  progress = null,
  offDay = false,
  disabled = false,
  onToggle,
  onIncrement,
  onAdjust,
  onOpen,
}) {
  const measured = Boolean(progress);
  const isDuration = progress?.type === "duration";
  const pct = measured && !done ? Math.min(100, Math.round((progress.count / progress.goal) * 100)) : 0;
  const unit = progress?.unitLabel ? ` ${progress.unitLabel}` : "";
  const figure = measured ? `${progress.count}/${progress.goal}${progress.inlineUnit ? unit : ""}` : "";
  const amountText = measured ? `${progress.count} de ${progress.goal}${unit}` : "";
  const plusLabel = `Sumar ${progress?.unitOne ? `un ${progress.unitOne}` : "uno"}: ${name}`;

  let metaText = meta;
  if (offDay) metaText = "No toca hoy";
  else if (done) metaText = "Cumplido hoy";

  // Sin botón cuando el hábito no toca hoy.
  let action = null;
  if (offDay) {
    action = null;
  } else if (!measured) {
    action = (
      <button
        type="button"
        className={styles.check}
        aria-pressed={done}
        aria-label={`${done ? "Desmarcar" : "Marcar cumplido"}: ${name}`}
        disabled={disabled}
        onClick={onToggle}
      >
        <span className={styles.checkCircle} aria-hidden="true">
          {done && <Icon name="check" size={16} strokeWidth={3} />}
        </span>
      </button>
    );
  } else if (done) {
    action = (
      <button
        type="button"
        className={styles.plus}
        aria-pressed="true"
        aria-label={`Volver a 0 hoy: ${name}`}
        disabled={disabled}
        onClick={onToggle}
      >
        <Icon name="check" size={18} strokeWidth={3} />
      </button>
    );
  } else {
    action = (
      <button
        type="button"
        className={styles.plus}
        aria-label={isDuration ? `Registrar tiempo: ${name}` : plusLabel}
        disabled={disabled}
        onClick={isDuration ? onAdjust : onIncrement}
      >
        <Icon name={isDuration ? "clock" : "plus"} size={18} strokeWidth={isDuration ? 2.2 : 2.6} />
      </button>
    );
  }

  return (
    <div
      className={cx(styles.row, measured && styles.counter, (done || offDay) && styles.done)}
      style={done || offDay ? undefined : { "--habit-tint": tint, "--habit-fill": fillTint }}
    >
      {measured && !done && !offDay && <div className={styles.fill} style={{ width: `${pct}%` }} aria-hidden="true" />}
      <div className={styles.inner}>
        <span className={styles.icon} aria-hidden="true">
          <CategoryIcon name={icon} size={20} />
        </span>
        <button type="button" className={styles.copy} onClick={onOpen} aria-label={`Ver detalles de ${name}`}>
          <span className={styles.name}>{name}</span>
          <span className={styles.meta}>{metaText}</span>
        </button>

        {measured && !offDay && (
          onAdjust ? (
            <button
              type="button"
              className={styles.count}
              onClick={onAdjust}
              disabled={disabled}
              aria-label={`${isDuration ? "Registrar tiempo" : "Ajustar cantidad"} de ${name}: ${amountText}`}
            >
              {figure}
            </button>
          ) : (
            <span className={styles.count}>{figure}</span>
          )
        )}
        {action}
      </div>
    </div>
  );
}

export default HabitRow;
