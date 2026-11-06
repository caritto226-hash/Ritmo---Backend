import { DESIGN_PREVIEW } from "../../ui/designPreview";

// Datos de ejemplo de Inicio.dc.html y Hoy.dc.html para los componentes que la API todavía no
// respalda (BACKEND_PENDIENTE #1, #2 y #5). Solo existen con VITE_DESIGN_PREVIEW=true en
// desarrollo; en producción es null y esos componentes muestran su estado sin datos.
export const HOME_PREVIEW = DESIGN_PREVIEW
  ? { streakDays: 5, water: { count: 4, goal: 8 } }
  : null;

const BAR_START_HOUR = 7;
const BAR_COUNT = 12;

// Barras de "Actividad" con la misma regla del mockup: pasadas crecientes, la actual lima.
export function previewActivityBars(pct, nowHours) {
  if (!DESIGN_PREVIEW) return null;
  const nowIndex = Math.floor(nowHours) - BAR_START_HOUR;
  return Array.from({ length: BAR_COUNT }, (_, index) => {
    if (index === nowIndex) return { height: Math.min(100, Math.max(30, pct) + 20), state: "current" };
    if (index < nowIndex) return { height: Math.min(100, 14 + index * 6), state: "past" };
    return { height: 10, state: "future" };
  });
}
