// Cálculos de Tareas a partir de GET /tasks (todo en el cliente: la API no filtra por fecha).
import { addDays, daysBetween, formatClockWithPeriod, formatShortDay, parseDateKey, toDateKey, WEEKDAYS_SHORT } from "../../utils/dates";
import { assignLanes, getTaskTimeRange, isTaskDone, selectDayTasks } from "./todaySelectors";

export const TASK_STATUS_LABELS = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  completada: "Completada",
};

// Punto de prioridad: alta --danger-strong, media --warning, baja --text-num-muted (TareasWeb.dc.html).
export const TASK_PRIORITIES = {
  alta: { label: "Alta", color: "var(--danger-strong)" },
  media: { label: "Media", color: "var(--warning)" },
  baja: { label: "Baja", color: "var(--text-num-muted)" },
};

export const NO_CATEGORY_KEY = "none";
const NO_CATEGORY_COLOR = "var(--lav-grey)";

export function isTaskOverdue(task, todayKey) {
  const dateKey = toDateKey(task.dueDate);
  return !isTaskDone(task) && dateKey !== null && dateKey < todayKey;
}

export function getTaskCategoryKey(task) {
  return task.category ? String(task.category.id) : NO_CATEGORY_KEY;
}

// Por fecha; dentro del mismo día, primero las que tienen hora (por hora) y luego las "sin hora".
function compareByDate(a, b) {
  const byDate = (toDateKey(a.dueDate) || "").localeCompare(toDateKey(b.dueDate) || "");
  if (byDate !== 0) return byDate;
  const startA = getTaskTimeRange(a)?.start ?? Infinity;
  const startB = getTaskTimeRange(b)?.start ?? Infinity;
  return startA - startB;
}

/**
 * Tareas de la lista web según el acceso del rail:
 * day = las del día elegido (y, si es hoy, las vencidas primero) · upcoming = desde mañana ·
 * archive = completadas, de la más reciente a la más antigua.
 */
export function selectListTasks(tasks, view, dayKey, todayKey) {
  if (view === "upcoming") {
    return tasks.filter((task) => (toDateKey(task.dueDate) || "") > todayKey).sort(compareByDate);
  }
  if (view === "archive") {
    return tasks.filter(isTaskDone).sort((a, b) => compareByDate(b, a));
  }
  const overdue = dayKey === todayKey
    ? tasks.filter((task) => isTaskOverdue(task, todayKey)).sort(compareByDate)
    : [];
  return [...overdue, ...selectDayTasks(tasks, dayKey).sort(compareByDate)];
}

export function filterTasks(tasks, status, categoryKey) {
  return tasks.filter((task) => {
    if (status === "pending" && isTaskDone(task)) return false;
    if (status === "done" && !isTaskDone(task)) return false;
    return categoryKey === "all" || getTaskCategoryKey(task) === categoryKey;
  });
}

// Columna "Cuándo": hora si es hoy, "Hoy · sin hora", "Venció ayer", "Mañana" o "Jue 5 nov".
export function formatTaskWhen(task, todayKey) {
  const dateKey = toDateKey(task.dueDate);
  if (!dateKey) return { text: "Sin fecha", overdue: false };
  if (isTaskOverdue(task, todayKey)) {
    const days = daysBetween(dateKey, todayKey);
    return { text: days === 1 ? "Venció ayer" : `Venció hace ${days} días`, overdue: true };
  }
  if (dateKey === todayKey) {
    const range = getTaskTimeRange(task);
    return { text: range ? formatClockWithPeriod(range.start) : "Hoy · sin hora", overdue: false };
  }
  return { text: daysBetween(todayKey, dateKey) === 1 ? "Mañana" : formatShortDay(dateKey), overdue: false };
}

// Bloques con hora de un día, en carriles. hot = la que está en curso o empieza en menos de 30 min.
export function selectTimedTasks(tasks, dateKey, nowHours = null) {
  const entries = selectDayTasks(tasks, dateKey)
    .map((task) => ({ task, range: getTaskTimeRange(task) }))
    .filter(({ range }) => range);

  return assignLanes(entries).map((entry) => {
    const done = isTaskDone(entry.task);
    return {
      ...entry,
      done,
      hot: !done && nowHours !== null && entry.range.start <= nowHours + 0.5 && entry.range.end > nowHours,
    };
  });
}

export function selectUntimedTasks(tasks, dateKey) {
  return selectDayTasks(tasks, dateKey).filter((task) => !getTaskTimeRange(task));
}

// Lunes a domingo de la semana de dateKey.
function mondayOf(dateKey) {
  return addDays(dateKey, -((parseDateKey(dateKey).weekday + 6) % 7));
}

// Domingo a sábado de la semana de dateKey (tira de días móvil: D L M M J V S).
export function selectWeekDays(dateKey) {
  const sunday = addDays(dateKey, -parseDateKey(dateKey).weekday);
  return Array.from({ length: 7 }, (_, index) => addDays(sunday, index));
}

/**
 * "Esta semana · completadas por día", de lunes a domingo.
 * La API no guarda cuándo se completó una tarea (BACKEND_PENDIENTE #5): se cuentan las
 * completadas según su fecha (dueDate), y la tarjeta lo dice en su etiqueta.
 */
export function selectWeekCompleted(tasks, todayKey) {
  const monday = mondayOf(todayKey);
  const days = Array.from({ length: 7 }, (_, index) => {
    const key = addDays(monday, index);
    return {
      key,
      label: WEEKDAYS_SHORT[parseDateKey(key).weekday],
      count: tasks.filter((task) => isTaskDone(task) && toDateKey(task.dueDate) === key).length,
      isToday: key === todayKey,
    };
  });
  return { days, total: days.reduce((sum, day) => sum + day.count, 0) };
}

// Cifras junto al título: siempre de hoy, sin importar el día elegido.
export function selectTaskStats(tasks, todayKey) {
  const today = selectDayTasks(tasks, todayKey);
  const overdue = tasks.filter((task) => isTaskOverdue(task, todayKey)).length;
  return {
    pending: today.filter((task) => !isTaskDone(task)).length + overdue,
    doneToday: today.filter(isTaskDone).length,
    week: selectWeekCompleted(tasks, todayKey).total,
    overdue,
  };
}

// "Por categoría": cuántas tareas hay de cada categoría (barra relativa a la mayor).
export function selectByCategory(tasks) {
  const groups = new Map();
  tasks.forEach((task) => {
    const key = getTaskCategoryKey(task);
    const current = groups.get(key) || {
      key,
      label: task.category?.name || "Sin categoría",
      color: task.category?.color || NO_CATEGORY_COLOR,
      count: 0,
    };
    current.count += 1;
    groups.set(key, current);
  });
  const list = [...groups.values()].sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...list.map((group) => group.count));
  return list.map((group) => ({ ...group, pct: Math.round((group.count / max) * 100) }));
}

// Días con tareas (punto de la tira de días y del calendario).
export function selectTaskDates(tasks) {
  const dates = new Set(tasks.map((task) => toDateKey(task.dueDate)));
  dates.delete(null);
  return dates;
}
