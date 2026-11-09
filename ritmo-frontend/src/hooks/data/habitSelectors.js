import categoryColors, { DEFAULT_CATEGORY_COLOR } from "../../constants/categoryColors";
import { getInkOnColor, isHexColor } from "../../utils/color";
import { addDays, formatClockWithPeriod, formatHourLabel, mondayOf, toHours } from "../../utils/dates";
import { isHabitDone } from "./todaySelectors";

// GET /habits solo dice si cada hábito está cumplido hoy (status). El historial por día, la racha
// y el conteo (4/8 vasos) no existen en la API (BACKEND_PENDIENTE #1 y #2): aquí solo se calcula
// lo que sale de ese dato y de reminderTime.

export { isHabitDone };

export const HABIT_STATUS_LABELS = { completado: "Cumplido hoy", pendiente: "Pendiente" };

// Hábito de conteo ("Tomar agua · 8 vasos"): la meta (goal) es la cantidad del día.
export function isCounterHabit(habit) {
  return Number(habit.goal) > 1;
}

// Opacidad de cada pastel en las tarjetas (web) y las burbujas (móvil) de los mockups.
const WEB_ALPHA = { [categoryColors[5]]: 55, [categoryColors[0]]: 80, [categoryColors[2]]: 75, [categoryColors[7]]: 90 };
const MOBILE_ALPHA = { [categoryColors[2]]: 90, [categoryColors[5]]: 82, [categoryColors[0]]: 90, [categoryColors[7]]: 92 };

// Color de la categoría si es claro (la tarjeta lleva texto oscuro); un color oscuro guardado o
// la falta de categoría usan el pastel neutro de la paleta.
export function getHabitColor(habit) {
  const color = habit.category?.color;
  return isHexColor(color) && getInkOnColor(color) === "var(--ink-on-light)" ? color.toUpperCase() : DEFAULT_CATEGORY_COLOR;
}

// platform "web" (tarjeta) o "mobile" (burbuja); percent fija la opacidad (relleno del conteo).
// La base de la mezcla (--habit-tint-base) es transparente en modo claro, como el mockup; en el
// oscuro es un gris claro opaco para que la tinta fija (--ink-on-light) siga contrastando.
export function getHabitTint(habit, platform = "web", percent) {
  const color = getHabitColor(habit);
  const alphas = platform === "web" ? WEB_ALPHA : MOBILE_ALPHA;
  const alpha = percent ?? alphas[color] ?? (platform === "web" ? 80 : 90);
  return `color-mix(in srgb, ${color} ${alpha}%, var(--habit-tint-base))`;
}

export function selectTodaySummary(habits) {
  return { done: habits.filter(isHabitDone).length, total: habits.length };
}

// Mensaje bajo el anillo "Hoy" según el avance (los del mockup, para cualquier cantidad de hábitos).
export function getTodayMessage({ done, total }) {
  if (total === 0) return "Crea tu primer hábito para empezar.";
  if (done === 0) return "Empieza con el más fácil.";
  if (done === total) return "¡Día completo! Pequeños pasos, gran ritmo.";
  if (total - done === 1) return "Solo te falta uno.";
  if (done / total >= 0.5) return "Vas a la mitad, ¡tú puedes!";
  return "Buen comienzo, sigue así.";
}

// Nivel 0–4 del mapa de constancia (con 4 hábitos, el nivel es la cantidad cumplida).
export function getHeatLevel({ done, total }) {
  if (!total || !done) return 0;
  return Math.max(1, Math.min(4, Math.round((done / total) * 4)));
}

function formatReminderClock(hours) {
  return Number.isInteger(hours) ? formatHourLabel(hours) : formatClockWithPeriod(hours);
}

/**
 * "Próximo recordatorio": el primer reminderTime después de ahora. Si hoy ya no queda ninguno,
 * el primero de mañana. null si ningún hábito tiene recordatorio.
 */
export function selectNextReminder(habits, nowHours) {
  const entries = habits
    .map((habit) => ({ habit, hours: toHours(habit.reminderTime) }))
    .filter((entry) => entry.hours !== null)
    .sort((a, b) => a.hours - b.hours);
  if (entries.length === 0) return null;
  const today = entries.find((entry) => entry.hours > nowHours);
  const next = today || entries[0];
  const clock = formatClockWithPeriod(next.hours);
  return { habit: next.habit, label: `${next.habit.name} · ${today ? clock : `mañana ${clock}`}` };
}

const TRACK_START = 7;
const TRACK_END = 19;
// Horas a menos de esta distancia (en % de la pista) comparten punto: los círculos de 30 px se
// montarían. Dos marcas a menos de LABEL_GAP alternan su etiqueta arriba y abajo.
const POINT_GAP = 4.5;
const LABEL_GAP = 9;

/**
 * "Recordatorios de hoy": un punto por hora de recordatorio sobre la pista de 7 a. m. a 7 p. m.
 * (se amplía si alguno queda fuera). Los hábitos con la misma hora, o con horas tan cercanas que
 * los puntos se montarían, comparten punto y su etiqueta lleva las horas ("1 p. m. · 1:15 p. m.").
 * state: done (ya pasó y todos sus hábitos están cumplidos), missed (pasó sin cumplir) o upcoming.
 */
export function selectReminderLine(habits, nowHours) {
  const byTime = new Map();
  habits.forEach((habit) => {
    const hours = toHours(habit.reminderTime);
    if (hours === null) return;
    byTime.set(hours, [...(byTime.get(hours) || []), habit]);
  });
  const times = [...byTime.keys()].sort((a, b) => a - b);
  const start = Math.min(TRACK_START, Math.floor(times[0] ?? TRACK_START));
  const end = Math.max(TRACK_END, Math.ceil(times[times.length - 1] ?? TRACK_END));
  const pos = (hours) => 4 + ((hours - start) / (end - start)) * 92;

  const clusters = [];
  times.forEach((hours) => {
    const last = clusters[clusters.length - 1];
    if (last && pos(hours) - pos(last.times[0]) < POINT_GAP) last.times.push(hours);
    else clusters.push({ times: [hours] });
  });

  let lastBelow = -Infinity;
  const points = clusters.map(({ times: group }) => {
    const habitsAt = group.flatMap((hours) => byTime.get(hours));
    const past = group[group.length - 1] <= nowHours;
    const left = pos(group[0]);
    const above = left - lastBelow < LABEL_GAP;
    if (!above) lastBelow = left;
    const label = group.map(formatReminderClock).join(" · ");
    return {
      key: String(group[0]),
      left,
      label,
      above,
      state: past ? (habitsAt.every(isHabitDone) ? "done" : "missed") : "upcoming",
      ariaLabel: `${label}: ${habitsAt.map((habit) => habit.name).join(", ")}`,
    };
  });

  const progress = Math.min(92, Math.max(0, pos(nowHours) - 4));
  return { points, progress };
}

// Rejilla de "Constancia": 5 semanas de lunes a domingo que terminan en la semana de hoy.
export function selectHeatKeys(todayKey) {
  const start = addDays(mondayOf(todayKey), -28);
  return Array.from({ length: 35 }, (_, index) => addDays(start, index));
}

// Semana de lunes a domingo de la tarjeta de hábito (web).
export function selectHabitWeekKeys(todayKey) {
  const monday = mondayOf(todayKey);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}
