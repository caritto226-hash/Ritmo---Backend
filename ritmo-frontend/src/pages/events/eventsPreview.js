import { DESIGN_PREVIEW } from "../../ui/designPreview";

// Datos de ejemplo de EventosWeb.dc.html para lo que la API todavía no respalda: el delta
// "+2" de "Esta semana" necesita comparar con la semana anterior según la fecha de realizado
// (BACKEND_PENDIENTE #5) y el recordatorio no existe en events (#9).
// Solo existen con VITE_DESIGN_PREVIEW=true en desarrollo; en producción es null y se muestra "—".
export const EVENTS_PREVIEW = DESIGN_PREVIEW
  ? { deltas: { week: "+2" }, reminder: "Recordatorio 30 min antes" }
  : null;
