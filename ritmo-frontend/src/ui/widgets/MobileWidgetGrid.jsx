import { Link } from "react-router-dom";
import Icon from "../icons/Icon";
import IconButton from "../primitives/IconButton";
import BottomSheet from "../primitives/BottomSheet";
import PillButton from "../primitives/PillButton";
import cx from "../cx";
import styles from "./MobileWidgetGrid.module.css";

/**
 * Bento de Hoy móvil (Hoy.dc.html): 2 columnas; size full (2 col), half (1) o tall (1 col × 2 filas).
 * widgets: [{ id, title, size, href, openLabel, tone: "white" | "ritmo", content }].
 * En modo Personalizar cada widget muestra flechas antes/después y quitar.
 */
function MobileWidgetGrid({ widgets, editing, onMove, onRemove, onAddRequest }) {
  return (
    <>
      <div className={styles.grid}>
        {widgets.map((widget) => (
          <section
            key={widget.id}
            aria-label={widget.title}
            className={cx(
              styles.widget,
              styles[widget.size],
              widget.tone === "ritmo" && styles.ritmo,
              editing && styles.editing,
            )}
          >
            {widget.content}

            {!editing && widget.href && (
              <IconButton
                as={Link}
                to={widget.href}
                icon="arrowUpRight"
                label={widget.openLabel}
                size={36}
                variant="subtle"
                strokeWidth={1.8}
                className={styles.open}
              />
            )}

            {editing && (
              <div className={styles.tools}>
                <IconButton icon="chevronLeft" label={`Mover antes: ${widget.title}`} size={44} variant="float" iconSize={16} strokeWidth={2} onClick={() => onMove(widget.id, -1)} />
                <IconButton icon="chevronRight" label={`Mover después: ${widget.title}`} size={44} variant="float" iconSize={16} strokeWidth={2} onClick={() => onMove(widget.id, 1)} />
                <IconButton icon="close" label={`Quitar ${widget.title}`} size={44} variant="primary" iconSize={14} strokeWidth={2.2} onClick={() => onRemove(widget.id)} />
              </div>
            )}
          </section>
        ))}
      </div>

      {widgets.length === 0 && (
        <button type="button" className={styles.emptyAdd} onClick={onAddRequest}>
          + Agregar un widget
        </button>
      )}
    </>
  );
}

// Aviso lima del modo Personalizar (móvil): "+ Agregar widget" y "Restablecer".
export function MobileEditBanner({ onAdd, onReset }) {
  return (
    <div role="status" className={styles.banner}>
      <span>Ordena tus widgets con las flechas o quítalos con la X.</span>
      <div className={styles.bannerActions}>
        <PillButton size="sm" variant="primary" onClick={onAdd}>+ Agregar widget</PillButton>
        <PillButton size="sm" variant="outline" onClick={onReset}>Restablecer</PillButton>
      </div>
    </div>
  );
}

/** Hoja "Agregar widget". hidden: [{ id, title, description }]. */
export function AddWidgetSheet({ open, hidden, onAdd, onClose }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Agregar widget" className={styles.sheet}>
      {hidden.map((widget) => (
        <button
          key={widget.id}
          type="button"
          className={styles.sheetItem}
          onClick={() => {
            onAdd(widget.id);
            onClose();
          }}
        >
          <span className={styles.sheetCopy}>
            <span className={styles.sheetTitle}>{widget.title}</span>
            <span className={styles.sheetDescription}>{widget.description}</span>
          </span>
          <span className={styles.sheetPlus} aria-hidden="true">
            <Icon name="plus" size={14} strokeWidth={2.2} />
          </span>
        </button>
      ))}
      {hidden.length === 0 && (
        <span className={styles.sheetEmpty}>
          Todos los widgets ya están en tu inicio. Quita alguno en Personalizar para volver a agregarlo aquí.
        </span>
      )}
    </BottomSheet>
  );
}

export default MobileWidgetGrid;
