// Formato de montos y fechas de Finanzas. Las fechas son "YYYY-MM-DD" y "hoy" se calcula en Bogotá,
// igual que en la API.

export const frequencyLabels = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

// "1500000" → "1.500.000". Se agrupa a mano porque Intl en español no agrupa los números de 4 cifras.
export function formatAmountDigits(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Pesos enteros: -1110800 → "-$1.110.800".
export function formatCurrency(value) {
  const amount = Math.round(Number(value));
  return `${amount < 0 ? "-$" : "$"}${formatAmountDigits(String(Math.abs(amount)))}`;
}

// Movimientos: "+$2.000.000" para ingresos y "−$12.000" (signo menos tipográfico) para gastos.
export function formatSignedAmount(value) {
  const amount = Math.round(Number(value));
  const digits = formatAmountDigits(String(Math.abs(amount)));
  return `${amount < 0 ? "−" : "+"}$${digits}`;
}

export function getTodayDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function toUtcDate(dateValue) {
  const [year, month, day] = dateValue.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDaysToDate(dateValue, days) {
  const date = toUtcDate(dateValue);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(fromDate, toDate) {
  return Math.round((toUtcDate(toDate) - toUtcDate(fromDate)) / 86400000);
}

function formatParts(dateValue, options) {
  return new Intl.DateTimeFormat("es-CO", { ...options, timeZone: "UTC" })
    .format(toUtcDate(dateValue))
    .replace(/\./g, "")
    .replace(/ de /g, " ");
}

// "28 oct"
export function formatDayMonth(dateValue) {
  return formatParts(dateValue, { day: "numeric", month: "short" });
}

// "Hoy", "Vence mañana", "Vence en 2 días", "Venció ayer", "Venció hace 3 días".
export function getDueLabel(scheduledDate, today = getTodayDate()) {
  const diff = daysBetween(today, scheduledDate);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Vence mañana";
  if (diff > 1) return `Vence en ${diff} días`;
  if (diff === -1) return "Venció ayer";
  return `Venció hace ${-diff} días`;
}

// Encabezados de la lista: "Hoy · 28 oct", "Ayer · 27 oct", "Lun 26 oct".
export function getDayGroupLabel(dateValue, today = getTodayDate()) {
  const diff = daysBetween(dateValue, today);
  if (diff === 0) return `Hoy · ${formatDayMonth(dateValue)}`;
  if (diff === 1) return `Ayer · ${formatDayMonth(dateValue)}`;
  const weekday = formatParts(dateValue, { weekday: "short" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${formatDayMonth(dateValue)}`;
}
