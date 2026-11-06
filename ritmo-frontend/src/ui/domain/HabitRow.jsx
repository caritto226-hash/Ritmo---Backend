import CategoryIcon from "../../components/CategoryIcon";
import Icon from "../icons/Icon";
import NoData from "../primitives/NoData";
import { NO_DATA } from "../designPreview";
import cx from "../cx";
import styles from "./HabitRow.module.css";

/**
 * Burbuja de hábito móvil (Habitos.dc.html), 76 px de alto, con vidrio y rayas.
 * tint: color del fondo. Con counter ({ count (null sin datos), goal, unit? }) es la burbuja que se
 * llena: fillTint pinta la parte cumplida y el botón negro suma uno (onIncrement; sin él queda
 * deshabilitado con "Próximamente"). Sin counter lleva el check de 32 px.
 * Completado = gris con check negro, sin rayas. Tocar el nombre abre el detalle (onOpen).
 */
function HabitRow({ name, meta, icon, tint, fillTint, done = false, counter = null, disabled = false, onToggle, onIncrement, onOpen }) {
  const isCounter = Boolean(counter);
  const missing = isCounter && counter.count === null && !done;
  const count = done && isCounter ? counter.goal : counter?.count;
  const pct = isCounter && !done && count !== null ? Math.min(100, Math.round((count / counter.goal) * 100)) : 0;
  const unit = counter?.unit;
  const plusLabel = `Sumar ${unit ? `un ${unit.one}` : "uno"}: ${name}`;

  return (
    <div
      className={cx(styles.row, isCounter && styles.counter, done && styles.done)}
      style={done ? undefined : { "--habit-tint": tint, "--habit-fill": fillTint }}
    >
      {isCounter && !done && <div className={styles.fill} style={{ width: `${pct}%` }} aria-hidden="true" />}
      <div className={styles.inner}>
        <span className={styles.icon} aria-hidden="true">
          <CategoryIcon name={icon} size={20} />
        </span>
        <button type="button" className={styles.copy} onClick={onOpen} aria-label={`Ver detalles de ${name}`}>
          <span className={styles.name}>{name}</span>
          <span className={styles.meta}>{done ? "Cumplido hoy" : meta}</span>
        </button>

        {isCounter ? (
          <>
            <span className={styles.countBlock}>
              <span className={styles.count}>{count ?? NO_DATA}/{counter.goal}</span>
              {missing && <NoData className={styles.noData} />}
            </span>
            {done ? (
              <button
                type="button"
                className={styles.plus}
                aria-pressed="true"
                aria-label={`Desmarcar: ${name}`}
                disabled={disabled}
                onClick={onToggle}
              >
                <Icon name="check" size={18} strokeWidth={3} />
              </button>
            ) : (
              <button
                type="button"
                className={styles.plus}
                aria-label={onIncrement ? plusLabel : `${plusLabel} (próximamente)`}
                disabled={disabled || !onIncrement}
                onClick={onIncrement}
              >
                <Icon name="plus" size={18} strokeWidth={2.6} />
              </button>
            )}
          </>
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default HabitRow;
