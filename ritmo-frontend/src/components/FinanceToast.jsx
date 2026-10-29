import { useEffect } from "react";
import { createPortal } from "react-dom";
import "../styles/finance-ui.css";

const TOAST_DURATION_MS = 3000;

// Aviso flotante sobre la barra inferior: no empuja el contenido y se anuncia con aria-live.
// La región viva siempre está montada para que los lectores de pantalla detecten cada mensaje nuevo.
function FinanceToast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onDone, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, onDone]);

  return createPortal(
    <div className="finance-toast-region" aria-live="polite" aria-atomic="true">
      {toast && (
        <p className={`finance-toast ${toast.type}`} key={toast.id}>
          {toast.message}
        </p>
      )}
    </div>,
    document.body,
  );
}

export default FinanceToast;
