import { useEffect } from "react";
import { createPortal } from "react-dom";
import cx from "../cx";
import styles from "./Toast.module.css";

const TOAST_DURATION_MS = 3000;

// Aviso flotante anunciado con aria-live. La región viva siempre está montada para que
// los lectores de pantalla detecten cada mensaje nuevo; toast = { id, message, type }.
function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onDone, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, onDone]);

  return createPortal(
    <div className={styles.region} aria-live="polite" aria-atomic="true">
      {toast && (
        <p className={cx(styles.toast, toast.type === "error" && styles.error)} key={toast.id}>
          {toast.message}
        </p>
      )}
    </div>,
    document.body,
  );
}

export default Toast;
