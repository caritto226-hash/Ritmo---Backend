import { DESIGN_PREVIEW } from "../../ui/designPreview";

// Datos de ejemplo de TareasWeb.dc.html para lo que la API todavía no respalda: los deltas
// junto al título ("+2", "+3", "−1") necesitan la fecha de completado (BACKEND_PENDIENTE #5).
// Solo existen con VITE_DESIGN_PREVIEW=true en desarrollo; en producción es null y se muestra "—".
export const TASKS_PREVIEW = DESIGN_PREVIEW
  ? { deltas: { done: "+2", week: "+3", overdue: "−1" } }
  : null;
