import { DESIGN_PREVIEW } from "../../ui/designPreview";

// Datos de ejemplo de HabitosWeb.dc.html y Habitos.dc.html para lo que la pantalla todavía no
// usa: racha, mejor racha, semana en círculos, mapa de constancia y "% esta semana" (fase C de
// Hábitos v2), los deltas (BACKEND_PENDIENTE #5) y los recordatorios cada 3 horas (#10). El
// conteo, la unidad y el tiempo del día ya son reales (fase B), así que no están aquí.
// Solo existen con VITE_DESIGN_PREVIEW=true en desarrollo; en producción es null y esos componentes
// muestran su estado sin datos. Los hábitos reales reciben estos valores por posición en la lista.
export const HABITS_PREVIEW = DESIGN_PREVIEW
  ? {
      stats: { streak: 5, streakDelta: "+1", week: "75%", weekDelta: "+8%", best: 12, bestDelta: "récord" },
      streaks: [5, 12, 3, 2],
      // Lunes a sábado de cada hábito (1 cumplido, 0 no, null no aplica); el domingo es hoy.
      weeks: [
        [1, 1, 1, 0.5, 1, 0.75],
        [1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, null],
        [0, 1, 0, 1, 1, 1],
      ],
      // Domingo a martes de la semana móvil (Habitos.dc.html).
      mobileWeek: [1, 0.75, 0.5],
      heat: [3, 4, 2, 4, 3, 1, 2, 4, 4, 3, 4, 2, 3, 3, 2, 3, 4, 4, 4, 3, 1, 4, 3, 2, 4, 4, 3, 3, 4, 3, 4, 2, 4, 3],
      reminders: { meta: "Tomar agua cada 3 horas", times: [7, 10, 13, 16, 19] },
    }
  : null;
