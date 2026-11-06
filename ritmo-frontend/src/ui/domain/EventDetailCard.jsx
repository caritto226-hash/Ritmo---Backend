import { useEffect, useRef, useState } from "react";
import Icon from "../icons/Icon";
import NoData from "../primitives/NoData";
import { NO_DATA } from "../designPreview";
import { getInkOnColor } from "../../utils/color";
import cx from "../cx";
import styles from "./EventDetailCard.module.css";

/**
 * Detalle del evento elegido en la tarjeta negra (EventosWeb.dc.html).
 * category: { label, color } (el color guardado; si es oscuro, la etiqueta va en blanco).
 * reminder: texto del recordatorio o null si no existe en la API (BACKEND_PENDIENTE #9): se
 * muestra "—" con "Próximamente". done cambia el botón entre "Marcar realizado" (lima) y
 * "Volver a programado" (blanco). Sin evento (empty) la tarjeta conserva su forma.
 * Cancelar (onCancel) es un tercer botón circular igual al lápiz y pide confirmación dentro de la
 * tarjeta. Cancelado (canceled): etiqueta de categoría gris y botón blanco "Restaurar evento"
 * (onRestore). Montarla con key del evento para que la confirmación no pase a otro evento.
 */
function EventDetailCard({
  titleId,
  kicker,
  category,
  title,
  when,
  place,
  reminder,
  done = false,
  canceled = false,
  empty = false,
  disabled = false,
  onToggle,
  onCancel,
  onRestore,
  onEdit,
  editLabel = "Editar evento",
  emptyActionLabel = "Nuevo evento",
  onEmptyAction,
}) {
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef(null);
  const chipOnDark = category && getInkOnColor(category.color) === "var(--ink-on-dark)";
  const chipStyle = canceled
    ? { "--chip-bg": "var(--surface-muted)", "--chip-ink": "var(--text)" }
    : { "--chip-bg": chipOnDark ? "var(--on-dark)" : category?.color };

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  async function confirmCancel() {
    const ok = await onCancel();
    if (ok !== false) setConfirming(false);
  }

  let actions;
  if (empty) {
    actions = <button type="button" className={styles.toggle} onClick={onEmptyAction}>{emptyActionLabel}</button>;
  } else if (confirming) {
    actions = (
      <>
        <button ref={confirmRef} type="button" className={cx(styles.toggle, styles.toggleWhite)} disabled={disabled} onClick={confirmCancel}>
          Sí, cancelar evento
        </button>
        <button type="button" className={styles.circle} aria-label="No cancelar" disabled={disabled} onClick={() => setConfirming(false)}>
          <Icon name="close" size={17} strokeWidth={1.8} />
        </button>
      </>
    );
  } else if (canceled) {
    actions = (
      <button type="button" className={cx(styles.toggle, styles.toggleWhite)} disabled={disabled} onClick={onRestore}>
        Restaurar evento
      </button>
    );
  } else {
    actions = (
      <>
        <button type="button" className={styles.toggle} aria-pressed={done} disabled={disabled} onClick={onToggle}>
          {done ? "Volver a programado" : "Marcar realizado"}
        </button>
        {onCancel && (
          <button type="button" className={styles.circle} aria-label="Cancelar evento" disabled={disabled} onClick={() => setConfirming(true)}>
            <Icon name="calendarX" size={17} strokeWidth={1.8} />
          </button>
        )}
      </>
    );
  }

  return (
    <section aria-labelledby={titleId} className={styles.card}>
      <div aria-hidden="true" className={styles.blob} />
      <div className={styles.top}>
        <span className={styles.kicker}>{kicker}</span>
        {category && <span className={styles.chip} style={chipStyle}>{category.label}</span>}
      </div>
      <h2 id={titleId} className={styles.title}>{title}</h2>
      <div className={styles.rows}>
        <span className={styles.row}><Icon name="clock" size={18} />{when || NO_DATA}</span>
        <span className={styles.row}><Icon name="pin" size={18} />{place || NO_DATA}</span>
        <span className={styles.row}>
          <Icon name="bellSm" size={18} />
          {reminder ?? (
            <>
              Recordatorio {NO_DATA}
              <NoData className={styles.noData} />
            </>
          )}
        </span>
        {confirming && (
          <span className={styles.row} role="alert">¿Cancelar este evento? Podrás restaurarlo después.</span>
        )}
      </div>
      <div className={styles.actions}>
        {actions}
        {!confirming && (
          <button type="button" className={styles.circle} aria-label={editLabel} disabled={empty} onClick={onEdit}>
            <Icon name="pencil" size={17} strokeWidth={1.8} />
          </button>
        )}
      </div>
    </section>
  );
}

export default EventDetailCard;
