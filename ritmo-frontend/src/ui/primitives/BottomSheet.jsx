import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import useDialogFocus from "../../hooks/useDialogFocus";
import IconButton from "./IconButton";
import cx from "../cx";
import styles from "./BottomSheet.module.css";

/**
 * Hoja inferior (móvil). En web (≥ 760 px) se muestra como diálogo centrado.
 * Bloquea Escape y el clic en el fondo mientras busy=true (por ejemplo, al confirmar un pago).
 * header reemplaza el encabezado estándar (título + cerrar) cuando la hoja necesita uno propio;
 * en ese caso labelledBy apunta al id de su título.
 */
function BottomSheet({ open, onClose, title, header, labelledBy, busy = false, className, children }) {
  const sheetRef = useRef(null);
  const titleId = useId();

  useDialogFocus(sheetRef, open, onClose, !busy);

  if (!open) return null;

  return createPortal(
    <div className={styles.layer}>
      <button
        type="button"
        className={styles.scrim}
        aria-label="Cerrar"
        tabIndex={-1}
        onClick={() => !busy && onClose()}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || (title ? titleId : undefined)}
        className={cx(styles.sheet, className)}
      >
        <span className={styles.handle} aria-hidden="true" />
        {header ?? (title && (
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>{title}</h2>
            <IconButton icon="close" label="Cerrar" size={44} variant="soft" onClick={onClose} disabled={busy} />
          </div>
        ))}
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default BottomSheet;
