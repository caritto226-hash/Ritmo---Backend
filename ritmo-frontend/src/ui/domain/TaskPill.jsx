import Icon from "../icons/Icon";
import cx from "../cx";
import { getInkOnColor } from "../../utils/color";
import styles from "./TaskPill.module.css";

/**
 * Píldora de tarea "sin hora".
 * variant "web" (TareasWeb.dc.html): gris claro; toda la píldora completa la tarea.
 * variant "mobile" (Tareas.dc.html): color de la categoría con vidrio; el círculo completa la
 * tarea y el título abre el detalle (onOpen).
 * tone "overdue": borde y texto --danger (tareas vencidas en móvil).
 * tone "canceled": evento cancelado (borde punteado, texto --text-done, sin check).
 * toggleLabel reemplaza la etiqueta del check (Eventos: "Marcar realizado: …").
 */
function TaskPill({ title, done, onToggle, onOpen, variant = "web", color, tone, disabled, toggleLabel: toggleLabelProp }) {
  const tinted = variant === "mobile" && !done && tone !== "overdue";
  const className = cx(styles.pill, styles[variant], done && styles.done, tone === "overdue" && !done && styles.overdue);
  const style = tinted && color ? { "--pill-tint": color, "--pill-ink": getInkOnColor(color) } : undefined;
  const check = (
    <span className={styles.check} aria-hidden="true">
      {done && <Icon name="check" size={variant === "mobile" ? 14 : 13} strokeWidth={3} />}
    </span>
  );
  const toggleLabel = toggleLabelProp || `${done ? "Marcar pendiente" : "Completar"}: ${title}`;

  // Evento cancelado: sin check; toda la píldora abre el detalle (desde ahí se restaura).
  if (tone === "canceled") {
    return (
      <button type="button" className={cx(styles.pill, styles[variant], styles.canceled)} onClick={onOpen} aria-label={`Ver detalles de ${title}, cancelado`}>
        <span className={styles.canceledTitle}>{title}</span>
        <span>· Cancelado</span>
      </button>
    );
  }

  if (!onOpen) {
    return (
      <button type="button" className={className} style={style} aria-pressed={done} aria-label={toggleLabel} onClick={onToggle} disabled={disabled}>
        {check}
        {title}
      </button>
    );
  }

  return (
    <div className={className} style={style}>
      <button type="button" className={styles.toggle} aria-pressed={done} aria-label={toggleLabel} onClick={onToggle} disabled={disabled}>
        {check}
      </button>
      <button type="button" className={styles.open} onClick={onOpen} aria-label={`Ver detalles de ${title}`}>
        {title}
      </button>
    </div>
  );
}

export default TaskPill;
