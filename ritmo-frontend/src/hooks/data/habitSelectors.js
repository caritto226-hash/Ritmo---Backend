import categoryColors, { DEFAULT_CATEGORY_COLOR } from "../../constants/categoryColors";
import { getInkOnColor, isHexColor } from "../../utils/color";
import { addDays, formatClockWithPeriod, formatHourLabel, mondayOf, toHours } from "../../utils/dates";
import { isHabitDone } from "./todaySelectors";

// GET /habits trae, por hábito, sus días (days, ISO 1 = lunes … 7 = domingo), el tipo de meta
// (goalType: check, count o duration), la meta (goal), la unidad en plural (unit) y el avance de
// hoy (todayAmount / todayTarget, status y appliesToday). El historial por día y la racha son de
// la fase C de Hábitos v2: aquí solo se calcula lo que sale del día de hoy y de reminderTime.

export { isHabitDone };

export const HABIT_STATUS_LABELS = { completado: "Cumplido hoy", pendiente: "Pendiente" };

export const DAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"];
export const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];
export const WEEKDAYS = [1, 2, 3, 4, 5];

// Atajos de unidad del formulario (se guardan en plural). Solo con ellos el botón usa el singular
// ("+ 1 vaso"); con una unidad escrita a mano dice "+ 1" y la cifra lleva la unidad ("3/8 tazas").
export const UNIT_PRESETS = [
  { many: "vasos", one: "vaso" },
  { many: "páginas", one: "página" },
  { many: "veces", one: "vez" },
];
export const MINUTE_PRESETS = [15, 30, 45, 60];

// Límites de la API (Hábitos v2, decisión 11).
export const GOAL_LIMITS = { count: 999, duration: 1440 };
export const MAX_DAY_AMOUNT = 9999;
export const MAX_UNIT_LENGTH = 20;

export function getUnitPreset(unit) {
  return UNIT_PRESETS.find((preset) => preset.many === unit) || null;
}

// Hábitos anteriores a v2 sin goalType: la meta decide, igual que la migración.
export function getGoalType(habit) {
  if (habit.goalType) return habit.goalType;
  return Number(habit.goal) > 1 ? "count" : "check";
}

// Hábito que se mide (cantidad o tiempo): lleva cifra, barra y la hoja de avance.
export function isCounterHabit(habit) {
  return getGoalType(habit) !== "check";
}

// "No toca hoy": sus días no incluyen hoy (o empieza después). Sin el dato, aplica.
export function appliesToday(habit) {
  return habit.appliesToday !== false;
}

/**
 * Avance de hoy de un hábito de cantidad o tiempo, listo para la tarjeta, la burbuja y la hoja.
 * null en los de solo marcar. unitLabel: "vasos", "tazas" o "min" (null si no tiene unidad);
 * unitOne: singular del atajo (null con texto libre); inlineUnit: la cifra corta del móvil lleva
 * la unidad (texto libre y tiempo; con los atajos el mockup muestra solo "4/8").
 */
export function selectHabitProgress(habit) {
  const type = getGoalType(habit);
  if (type === "check") return null;
  const goal = Number(habit.todayTarget ?? habit.goal) || 1;
  const preset = type === "count" ? getUnitPreset(habit.unit) : null;
  const unitLabel = type === "duration" ? "min" : habit.unit || null;
  return {
    type,
    count: Number(habit.todayAmount) || 0,
    goal,
    unitLabel,
    unitOne: preset?.one ?? null,
    inlineUnit: Boolean(unitLabel) && !preset,
  };
}

// "8 vasos", "8" o "30 min".
export function formatGoal(habit) {
  const type = getGoalType(habit);
  if (type === "duration") return `${habit.goal} min`;
  if (type === "count") return habit.unit ? `${habit.goal} ${habit.unit}` : String(habit.goal);
  return null;
}

// Frecuencia de la tarjeta: "Diario · 8 vasos" en el mockup.
export function formatHabitMeta(habit) {
  const goal = formatGoal(habit);
  return goal ? `${habit.frequency} · ${goal}` : habit.frequency;
}

// "4 de 8 vasos" / "15 de 30 min" (lectores de pantalla y detalle).
export function describeProgress(progress) {
  return `${progress.count} de ${progress.goal}${progress.unitLabel ? ` ${progress.unitLabel}` : ""}`;
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

// Los que tocan hoy primero y "No toca hoy" al final (Hábitos v2, decisión 8), en el orden de la API.
export function splitByToday(habits) {
  return { today: habits.filter(appliesToday), offDay: habits.filter((habit) => !appliesToday(habit)) };
}

// Semana de la tarjeta (web), lunes a domingo: hoy sale del avance real; los días que el hábito no
// tiene son null (círculo punteado); los días anteriores no tienen datos todavía (undefined, fase
// C) salvo en la vista previa (previewWeek: lunes a sábado del mockup).
export function selectCardWeek(habit, weekKeys, todayKey, previewWeek) {
  const progress = selectHabitProgress(habit);
  const days = habit.days?.length ? habit.days : ALL_DAYS;
  return weekKeys.map((key, index) => {
    let value;
    if (!days.includes(index + 1)) value = null;
    else if (key < todayKey) value = previewWeek ? previewWeek[index] : undefined;
    else if (key === todayKey) {
      if (!appliesToday(habit)) value = null;
      else if (isHabitDone(habit)) value = 1;
      else value = progress ? Math.min(1, progress.count / progress.goal) : 0;
    }
    return { key, label: DAY_LETTERS[index], value, today: key === todayKey };
  });
}

// Cumplidos / aplicables hoy (Hábitos v2, decisión 2): los que no tocan hoy no cuentan.
export function selectTodaySummary(habits) {
  const today = habits.filter(appliesToday);
  return { done: today.filter(isHabitDone).length, total: today.length };
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
  // Un hábito que no toca hoy no tiene recordatorio hoy (si no, saldría como no cumplido).
  habits.filter(appliesToday).forEach((habit) => {
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
