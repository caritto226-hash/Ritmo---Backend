// Cálculos de Eventos a partir de GET /events (todo en el cliente: la API no filtra por fecha).
// Los cancelados se dibujan en su hora (con el estilo punteado) y aparecen en "Próximos", pero no
// cuentan como pendientes ni como realizados en ninguna cifra (tampoco en la esfera del Inicio).
import { DEFAULT_CATEGORY_COLOR } from "../../constants/categoryColors";
import layoutColumns from "../../ui/charts/layoutColumns";
import {
  addDays,
  daysBetween,
  formatClock,
  formatClockWithPeriod,
  formatShortDay,
  mondayOf,
  toDateKey,
} from "../../utils/dates";
import { getEventTimeRange, isEventCanceled, isEventDone, selectDayEvents } from "./todaySelectors";

// En el diseño "completado" se llama "Realizado".
export const EVENT_STATUS_LABELS = {
  programado: "Programado",
  completado: "Realizado",
  cancelado: "Cancelado",
};

// Eventos no tiene categorías por defecto (BACKEND_PENDIENTE #14): sin categoría se usa un
// pastel de la paleta del selector.
export function getEventColor(event) {
  return event.category?.color || DEFAULT_CATEGORY_COLOR;
}

// Un bloque no pasa de la medianoche en la rejilla del día.
function getGridRange(event) {
  const range = getEventTimeRange(event);
  return range ? { start: range.start, end: Math.min(range.end, 24) } : null;
}

export function isAllDayEvent(event) {
  return getEventTimeRange(event) === null;
}

// Lunes a domingo de la semana de dateKey (rejilla web).
export function selectWeekKeys(dateKey) {
  const monday = mondayOf(dateKey);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

// Días con eventos (punto de la tira de días y del mes).
export function selectEventDates(events) {
  const dates = new Set(events.filter((event) => !isEventCanceled(event)).map((event) => toDateKey(event.eventDate)));
  dates.delete(null);
  return dates;
}

/**
 * Un día de la rejilla: bloques con hora repartidos en carriles (los que se solapan comparten el
 * ancho de la columna) y los de todo el día aparte, para la franja de arriba. Incluye los
 * cancelados: siguen ocupando su lugar en la hora.
 */
export function selectGridDay(events, dateKey) {
  const dayEvents = events
    .filter((event) => toDateKey(event.eventDate) === dateKey)
    .sort((a, b) => (getEventTimeRange(a)?.start ?? -1) - (getEventTimeRange(b)?.start ?? -1));
  const timed = dayEvents
    .map((event) => ({ event, ...getGridRange(event) }))
    .filter((entry) => entry.start !== undefined);
  return {
    timed: layoutColumns(timed),
    allDay: dayEvents.filter(isAllDayEvent),
  };
}

// Rango de horas visible: 7 a. m. a 8 p. m. (EventosWeb.dc.html), ampliado si un bloque queda fuera.
export function selectHourRange(gridDays, startHour = 7, endHour = 20) {
  const timed = gridDays.flatMap((day) => day.timed);
  return {
    start: Math.min(startHour, ...timed.map((entry) => Math.floor(entry.start))),
    end: Math.max(endHour, ...timed.map((entry) => Math.ceil(entry.end))),
  };
}

// Cifras junto al título: semana de hoy (lunes a domingo) y hoy, sin importar el día elegido.
export function selectEventStats(events, todayKey) {
  const week = new Set(selectWeekKeys(todayKey));
  const weekEvents = events.filter((event) => week.has(toDateKey(event.eventDate)) && !isEventCanceled(event));
  return {
    week: weekEvents.length,
    todayLeft: selectDayEvents(events, todayKey).filter((event) => !isEventDone(event)).length,
    done: weekEvents.filter(isEventDone).length,
  };
}

// "20 min", "2 h 20 min", "2 h".
export function formatCountdown(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ""}`;
}

// "1:00 – 2:30 p. m.", "11:00 a. m. – 12:30 p. m." o "Todo el día".
export function formatEventTime(event) {
  const range = getGridRange(event);
  if (!range) return "Todo el día";
  const samePeriod = (range.start < 12) === (range.end < 12) && range.end < 24;
  return samePeriod
    ? `${formatClock(range.start)} – ${formatClockWithPeriod(range.end)}`
    : `${formatClockWithPeriod(range.start)} – ${formatClockWithPeriod(range.end)}`;
}

// "1:00 – 2:30" (bloques de la rejilla) o "Todo el día".
export function formatEventClockRange(event) {
  const range = getGridRange(event);
  return range ? `${formatClock(range.start)} – ${formatClock(range.end)}` : "Todo el día";
}

function compareEvents(a, b) {
  const byDate = (toDateKey(a.eventDate) || "").localeCompare(toDateKey(b.eventDate) || "");
  if (byDate !== 0) return byDate;
  return (getEventTimeRange(a)?.start ?? -1) - (getEventTimeRange(b)?.start ?? -1);
}

// "Próximos": programados y cancelados de mañana en adelante (el mockup no repite los de hoy).
export function selectUpcoming(events, todayKey, limit = 3) {
  return events
    .filter((event) => !isEventDone(event) && (toDateKey(event.eventDate) || "") > todayKey)
    .sort(compareEvents)
    .slice(0, limit);
}

/**
 * Siguiente evento programado desde ahora: hoy los que aún no empiezan (con hora) y luego los de
 * los días siguientes. minutes es la cuenta regresiva si es hoy; null si es otro día.
 */
export function selectNextEvent(events, todayKey, nowHours) {
  const next = events
    .filter((event) => {
      if (event.status !== "programado") return false;
      const dateKey = toDateKey(event.eventDate) || "";
      if (dateKey > todayKey) return true;
      const range = getEventTimeRange(event);
      return dateKey === todayKey && range !== null && range.start > nowHours;
    })
    .sort(compareEvents)[0];
  if (!next) return null;
  const dateKey = toDateKey(next.eventDate);
  const range = getEventTimeRange(next);
  return {
    event: next,
    dateKey,
    minutes: dateKey === todayKey && range ? Math.max(1, Math.round((range.start - nowHours) * 60)) : null,
  };
}

// "en 20 min" hoy, "mañana" o "Jue 5 nov".
export function formatNextWhen(next, todayKey) {
  if (next.minutes !== null) return `en ${formatCountdown(next.minutes)}`;
  return daysBetween(todayKey, next.dateKey) === 1 ? "mañana" : formatShortDay(next.dateKey);
}

// Evento del detalle web cuando todavía no se ha tocado ninguno: el siguiente; si no hay, el
// último que ya pasó.
export function selectDefaultEvent(events, todayKey, nowHours) {
  const next = selectNextEvent(events, todayKey, nowHours);
  if (next) return next.event;
  const past = events.filter((event) => !isEventCanceled(event)).sort(compareEvents);
  return past[past.length - 1] || null;
}
