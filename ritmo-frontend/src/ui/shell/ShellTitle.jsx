import { createPortal } from "react-dom";
import { useShell } from "./ShellContext";

// La página pinta su fila de título (PageTitle) en el hueco que deja AppShellWeb entre la
// cabecera y el cuerpo. El portal conserva el estado y los manejadores de la página.
function ShellTitle({ children }) {
  const { titleSlot } = useShell();
  return titleSlot ? createPortal(children, titleSlot) : null;
}

export default ShellTitle;
