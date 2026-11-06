import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../icons/Icon";
import IconButton from "../primitives/IconButton";
import PillButton from "../primitives/PillButton";
import cx from "../cx";
import styles from "./WidgetGrid.module.css";

/**
 * Rejilla de widgets del Inicio web (Inicio.dc.html): 4 columnas (2 entre 760 y 1180 px).
 * widgets: [{ id, title, span, tall, canResize, meta, href, openLabel, tone: "white" | "ritmo", content }].
 * En modo Personalizar: arrastrar para reordenar, flechas antes/después, ancho y quitar.
 */
function WidgetGrid({ widgets, editing, onMoveTo, onMove, onResize, onRemove }) {
  const dragId = useRef(null);
  const [dragging, setDragging] = useState(null);

  function handleDragStart(event, id) {
    if (!editing) return;
    dragId.current = id;
    setDragging(id);
    try {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
    } catch {
      // Algunos navegadores no permiten escribir en dataTransfer; el arrastre sigue con dragId.
    }
  }

  function handleDrop(event, id) {
    if (!editing) return;
    event.preventDefault();
    if (dragId.current) onMoveTo(dragId.current, id);
    dragId.current = null;
    setDragging(null);
  }

  return (
    <div className={styles.grid}>
      {widgets.map((widget) => (
        <section
          key={widget.id}
          aria-label={widget.title}
          draggable={editing}
          onDragStart={(event) => handleDragStart(event, widget.id)}
          onDragOver={(event) => editing && event.preventDefault()}
          onDrop={(event) => handleDrop(event, widget.id)}
          onDragEnd={() => setDragging(null)}
          className={cx(
            styles.widget,
            styles[`span${widget.span}`],
            widget.tall && styles.rows2,
            widget.tone === "ritmo" && styles.ritmo,
            editing && styles.editing,
            dragging === widget.id && styles.dragging,
          )}
        >
          <div className={styles.header}>
            <h2 className={styles.title}>
              {editing && (
                <span className={styles.handle} aria-hidden="true">
                  <Icon name="dragDots" size={18} />
                </span>
              )}
              {widget.title}
            </h2>
            {editing ? (
              <div className={styles.tools}>
                {widget.canResize && (
                  <button
                    type="button"
                    className={styles.sizeButton}
                    aria-label={`Cambiar tamaño, ancho actual ${widget.span}`}
                    onClick={() => onResize(widget.id)}
                  >
                    Ancho {widget.span}
                  </button>
                )}
                <IconButton icon="chevronLeft" label="Mover antes" size={40} variant="outline" strokeWidth={2} onClick={() => onMove(widget.id, -1)} />
                <IconButton icon="chevronRight" label="Mover después" size={40} variant="outline" strokeWidth={2} onClick={() => onMove(widget.id, 1)} />
                <IconButton icon="close" label="Quitar widget" size={40} variant="primary" iconSize={14} strokeWidth={2.2} onClick={() => onRemove(widget.id)} />
              </div>
            ) : (
              <div className={styles.tools}>
                {widget.meta && <span className={styles.meta}>{widget.meta}</span>}
                {widget.href && (
                  <IconButton
                    as={Link}
                    to={widget.href}
                    icon="arrowUpRight"
                    label={widget.openLabel}
                    size={40}
                    variant={widget.tone === "ritmo" ? "surface" : "soft"}
                  />
                )}
              </div>
            )}
          </div>
          {widget.content}
        </section>
      ))}
    </div>
  );
}

// Aviso lima del modo Personalizar con Restablecer y Listo.
export function EditBanner({ onReset, onDone }) {
  return (
    <div role="status" className={styles.banner}>
      <span className={styles.bannerText}>Arrastra los widgets para ordenarlos, cambia su tamaño o quítalos.</span>
      <PillButton size="sm" variant="outline" onClick={onReset}>Restablecer</PillButton>
      <PillButton size="sm" variant="primary" className={styles.bannerDone} onClick={onDone}>Listo</PillButton>
    </div>
  );
}

/**
 * Botón "Agregar widget" con su ventana flotante de widgets disponibles.
 * hidden: [{ id, title }]. Se cierra con Escape o al hacer clic fuera.
 */
export function AddWidgetButton({ hidden, onAdd }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handlePointer(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    }
    function handleKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={styles.addWrap}>
      <PillButton icon="plus" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        Agregar widget
      </PillButton>
      {open && (
        <div role="dialog" aria-label="Agregar widget" className={styles.popover}>
          <span className={styles.popoverTitle}>Widgets disponibles</span>
          {hidden.map((widget) => (
            <button
              key={widget.id}
              type="button"
              className={styles.popoverItem}
              onClick={() => {
                onAdd(widget.id);
                setOpen(false);
              }}
            >
              {widget.title}
              <span className={styles.popoverPlus} aria-hidden="true">
                <Icon name="plus" size={14} strokeWidth={2.2} />
              </span>
            </button>
          ))}
          {hidden.length === 0 && (
            <span className={styles.popoverEmpty}>Todos los widgets ya están en tu inicio.</span>
          )}
        </div>
      )}
    </div>
  );
}

export default WidgetGrid;
