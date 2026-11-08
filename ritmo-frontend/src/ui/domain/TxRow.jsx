import Icon from "../icons/Icon";
import CategoryIcon from "../../components/CategoryIcon";
import cx from "../cx";
import { getInkOnColor } from "../../utils/color";
import styles from "./TxRow.module.css";

/**
 * Fila de un movimiento o de un recurrente.
 * variant "web" (FinanzasWeb.dc.html: ficha con inicial, concepto + nota, chip de categoría y monto),
 * "mobile" (Finanzas.dc.html: ficha con ícono, concepto + meta y monto) o "list" (Recurrentes.dc.html:
 * igual que "mobile", con 12 px arriba y abajo).
 * color es el de la categoría, tal cual; la inicial o el ícono usan la tinta que contrasta.
 * metaStrong pinta la meta en negro 500 (vencimientos de Recurrentes). note puede ser un nodo
 * (por ejemplo NoData). Con onClick la fila es un botón; chevron agrega la flecha de Recurrentes.
 */
function TxRow({
  variant = "web",
  title,
  note,
  category,
  color,
  icon = "tag",
  amount,
  income = false,
  metaStrong = false,
  chevron = false,
  onClick,
  ariaLabel,
}) {
  const isWeb = variant === "web";
  const tileStyle = color ? { background: color, color: getInkOnColor(color) } : undefined;
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      className={cx(styles.row, isWeb ? styles.web : styles.mobile, variant === "list" && styles.list, onClick && styles.clickable)}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className={styles.tile} style={tileStyle} aria-hidden="true">
        {isWeb ? (title || "").trim().charAt(0).toUpperCase() || "·" : <CategoryIcon name={icon} size={20} />}
      </span>
      <span className={styles.copy}>
        <span className={styles.title}>{title}</span>
        {note && <span className={cx(styles.note, metaStrong && styles.noteStrong)}>{note}</span>}
      </span>
      {isWeb && <span className={styles.category}>{category}</span>}
      <span className={cx(styles.amount, income && styles.income)}>{amount}</span>
      {chevron && <Icon name="chevronRight" size={18} strokeWidth={2} className={styles.chevron} />}
    </Component>
  );
}

export default TxRow;
