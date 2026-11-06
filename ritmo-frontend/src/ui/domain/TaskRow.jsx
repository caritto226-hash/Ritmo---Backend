import CheckCircle from "../primitives/CheckCircle";
import cx from "../cx";
import { getInkOnColor } from "../../utils/color";
import styles from "./TaskRow.module.css";

// Encabezado de la tabla "Todas las tareas" (mismas columnas que TaskRow).
export function TaskTableHeader() {
  return (
    <div className={cx(styles.grid, styles.header)} aria-hidden="true">
      <span />
      <span>Tarea</span>
      <span>Categoría</span>
      <span>Prioridad</span>
      <span>Cuándo</span>
    </div>
  );
}

/**
 * Fila de la tabla de tareas (TareasWeb.dc.html): check, título, categoría, prioridad y cuándo.
 * El check completa la tarea; el título abre su detalle (onOpen).
 * category: { name, color } o null. priority: { label, color }. when: { text, overdue }.
 * Completada = título gris y check negro, nunca tachada. Vencida = "cuándo" en --danger, 600.
 */
function TaskRow({ title, done, category, priority, when, onToggle, onOpen, disabled }) {
  return (
    <div className={cx(styles.grid, styles.row, done && styles.done)}>
      <CheckCircle
        checked={done}
        onToggle={onToggle}
        disabled={disabled}
        label={`${done ? "Marcar pendiente" : "Completar"}: ${title}`}
      />
      <button type="button" className={styles.title} onClick={onOpen} aria-label={`Ver detalles de ${title}`}>
        {title}
      </button>
      <span
        className={cx(styles.category, !category && styles.noCategory)}
        style={category?.color ? { "--row-tint": category.color, "--row-ink": getInkOnColor(category.color) } : undefined}
      >
        {category?.name || "Sin categoría"}
      </span>
      <span className={styles.priority}>
        <span className={styles.dot} style={{ "--row-dot": priority.color }} aria-hidden="true" />
        {priority.label}
      </span>
      <span className={cx(styles.when, when.overdue && styles.overdue)}>{when.text}</span>
    </div>
  );
}

export default TaskRow;
