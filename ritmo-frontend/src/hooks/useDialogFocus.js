import { useEffect, useRef } from "react";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Foco de un diálogo: al abrir enfoca [data-autofocus] (o el primer control), mantiene Tab dentro,
// cierra con Escape y al cerrar devuelve el foco a donde estaba.
// active=false pausa Escape y Tab, por ejemplo mientras otro diálogo está encima.
export default function useDialogFocus(containerRef, open, onClose, active = true) {
  const onCloseRef = useRef(onClose);
  const activeRef = useRef(active);

  useEffect(() => {
    onCloseRef.current = onClose;
    activeRef.current = active;
  });

  useEffect(() => {
    if (!open) return undefined;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement;
    const initial = container?.querySelector("[data-autofocus]") || container?.querySelector(FOCUSABLE);
    initial?.focus();

    function handleKeyDown(event) {
      if (!activeRef.current || !container) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...container.querySelectorAll(FOCUSABLE)].filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open, containerRef]);
}
