import Icon from "../icons/Icon";
import cx from "../cx";
import styles from "./NextReminderCard.module.css";

/**
 * Tarjeta negra "Próximo recordatorio" de Hábitos: variant "web" (HabitosWeb.dc.html, campana
 * lima) o "mobile" (Habitos.dc.html, campana lila). onEdit abre el hábito; sin él, "Editar"
 * queda deshabilitado (no hay recordatorios).
 */
function NextReminderCard({ variant = "web", titleId, title, onEdit, editLabel }) {
  const isWeb = variant === "web";
  const Title = isWeb ? "h2" : "span";

  return (
    <section aria-labelledby={titleId} className={cx(styles.card, isWeb ? styles.web : styles.mobile)}>
      <span className={styles.icon} aria-hidden="true">
        <Icon name="bell" size={20} strokeWidth={isWeb ? 1.8 : 2} />
      </span>
      <div className={styles.copy}>
        <span className={styles.kicker}>Próximo recordatorio</span>
        <Title id={titleId} className={styles.title}>{title}</Title>
      </div>
      <button type="button" className={styles.edit} onClick={onEdit} disabled={!onEdit} aria-label={editLabel}>
        Editar
      </button>
    </section>
  );
}

export default NextReminderCard;
