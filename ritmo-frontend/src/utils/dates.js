// Fechas del día a día. La API guarda DATE como "YYYY-MM-DD", DATETIME como "YYYY-MM-DD HH:mm:ss"
// y TIME como "HH:mm:ss"; "hoy" y "ahora" se calculan en hora de Bogotá, igual que el backend.

const TIME_ZONE = "America/Bogota";

export const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
export const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// { dateKey: "2026-10-29", hours: 10.67 } en Bogotá.
export function getBogotaNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return {
    dateKey: `${value.year}-${value.month}-${value.day}`,
    hours: Number(value.hour) + Number(value.minute) / 60,
  };
}

// "2026-10-29 09:00:00" o "2026-10-29" → "2026-10-29"; cualquier otra cosa → null.
export function toDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
}

// "14:30:00" → 14.5. También acepta un DATETIME ("2026-10-29 14:30:00").
export function toHours(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/(?:^|[ T])(\d{2}):(\d{2})/);
  return match ? Number(match[1]) + Number(match[2]) / 60 : null;
}

export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month: month - 1, day, weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay() };
}

export function makeDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function addDays(dateKey, days) {
  const { year, month, day } = parseDateKey(dateKey);
  const date = new Date(Date.UTC(year, month, day + days));
  return date.toISOString().slice(0, 10);
}

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// Días de calendario de fromKey a toKey (negativo si toKey es anterior).
export function daysBetween(fromKey, toKey) {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  return Math.round((Date.UTC(to.year, to.month, to.day) - Date.UTC(from.year, from.month, from.day)) / 86400000);
}

// "Jue 5 nov" (columna "Cuándo" de Tareas)
export function formatShortDay(dateKey) {
  const { month, day, weekday } = parseDateKey(dateKey);
  return `${WEEKDAYS_SHORT[weekday]} ${day} ${MONTHS_SHORT[month]}`;
}

// "Jue 29 oct, 2026" (píldora de fecha del Inicio web)
export function formatDayPill(dateKey) {
  const { year, month, day, weekday } = parseDateKey(dateKey);
  return `${WEEKDAYS_SHORT[weekday]} ${day} ${MONTHS_SHORT[month]}, ${year}`;
}

// "Domingo 1 de noviembre" (subtítulo de Hoy móvil)
export function formatLongDate(dateKey) {
  const { month, day, weekday } = parseDateKey(dateKey);
  return `${WEEKDAYS[weekday]} ${day} de ${MONTHS[month]}`;
}

// "Jueves 29 oct" (navegación de la Agenda)
export function formatAgendaDay(dateKey) {
  const { month, day, weekday } = parseDateKey(dateKey);
  return `${WEEKDAYS[weekday]} ${day} ${MONTHS_SHORT[month]}`;
}

// "Octubre 2026"
export function formatMonthTitle(year, month) {
  return `${capitalize(MONTHS[month])} ${year}`;
}

// 10.67 → "10:40" (12 h, sin sufijo, como las marcas de las líneas de tiempo)
export function formatClock(hours) {
  const total = Math.round(hours * 60);
  const hour = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${hour % 12 || 12}:${String(minutes).padStart(2, "0")}`;
}

// 10.67 → "10:40 a. m."
export function formatClockWithPeriod(hours) {
  const hour = Math.floor(Math.round(hours * 60) / 60) % 24;
  return `${formatClock(hours)} ${hour < 12 ? "a. m." : "p. m."}`;
}

// 7 → "7 a. m."; 12 → "12 p. m."
export function formatHourLabel(hour) {
  return `${hour % 12 || 12} ${hour < 12 ? "a. m." : "p. m."}`;
}
