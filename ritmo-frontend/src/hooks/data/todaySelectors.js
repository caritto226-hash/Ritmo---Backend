// Cálculos del Inicio a partir de los datos reales (todo en el cliente: la API no filtra por fecha).
import { addDays, daysInMonth, parseDateKey, toDateKey, toHours, WEEKDAYS_SHORT } from "../../utils/dates";

export const isTaskDone = (task) => task.status === "completada";
export const isHabitDone = (habit) => habit.status?.toLowerCase() === "completado";
export const isEventDone = (event) => event.status === "completado";
export const isEventCanceled = (event) => event.status === "cancelado";

// Sin duración guardada, un bloque de la línea de tiempo ocupa una hora.
const DEFAULT_DURATION_MINUTES = 60;
const MAX_LANES = 3;

export function getTaskTimeRange(task) {
  const start = toHours(task.startAt);
  if (start === null) return null;
  const savedEnd = toHours(task.endAt);
  const end = savedEnd !== null && savedEnd > start
    ? savedEnd
    : start + (Number(task.duration) || DEFAULT_DURATION_MINUTES) / 60;
  return { start, end };
}

export function getEventTimeRange(event) {
  const start = toHours(event.eventTime);
  if (start === null) return null;
  return { start, end: start + (Number(event.duration) || DEFAULT_DURATION_MINUTES) / 60 };
}

// Tareas con fecha del día: primero las "sin hora" y luego por hora de inicio.
export function selectDayTasks(tasks, dateKey) {
  return tasks
    .filter((task) => toDateKey(task.dueDate) === dateKey)
    .map((task) => ({ task, range: getTaskTimeRange(task) }))
    .sort((a, b) => (a.range?.start ?? -1) - (b.range?.start ?? -1))
    .map(({ task }) => task);
}

// Eventos del día que siguen en pie (los cancelados no cuentan ni se dibujan).
export function selectDayEvents(events, dateKey) {
  return events
    .filter((event) => toDateKey(event.eventDate) === dateKey && !isEventCanceled(event))
    .sort((a, b) => (getEventTimeRange(a)?.start ?? -1) - (getEventTimeRange(b)?.start ?? -1));
}

/**
 * "Tu ritmo de hoy": (tareas hechas + hábitos cumplidos + eventos realizados) / total del día.
 * /dashboard.todayRitmo no cuenta eventos, por eso se calcula aquí (BACKEND_PENDIENTE #4).
 */
export function selectRitmo({ tasks, habits, events }, todayKey) {
  const dayTasks = selectDayTasks(tasks, todayKey);
  const dayEvents = selectDayEvents(events, todayKey);
  const parts = {
    tasks: { done: dayTasks.filter(isTaskDone).length, total: dayTasks.length },
    habits: { done: habits.filter(isHabitDone).length, total: habits.length },
    events: { done: dayEvents.filter(isEventDone).length, total: dayEvents.length },
  };
  const done = parts.tasks.done + parts.habits.done + parts.events.done;
  const total = parts.tasks.total + parts.habits.total + parts.events.total;
  return { ...parts, done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

// Bloques con hora de un día para la Agenda, repartidos en hasta 3 carriles sin solaparse.
export function selectAgendaItems({ tasks, events }, dateKey) {
  const items = [
    ...selectDayTasks(tasks, dateKey)
      .map((task) => ({ kind: "task", item: task, range: getTaskTimeRange(task) }))
      .filter(({ range }) => range),
    ...selectDayEvents(events, dateKey)
      .map((event) => ({ kind: "event", item: event, range: getEventTimeRange(event) }))
      .filter(({ range }) => range),
  ].sort((a, b) => a.range.start - b.range.start);

  const laneEnds = [];
  return items.map((entry) => {
    let lane = laneEnds.findIndex((end) => end <= entry.range.start);
    if (lane < 0 && laneEnds.length < MAX_LANES) lane = laneEnds.length;
    if (lane < 0) lane = laneEnds.indexOf(Math.min(...laneEnds));
    laneEnds[lane] = entry.range.end;
    return {
      ...entry,
      key: `${entry.kind}-${entry.item.id}`,
      lane,
      done: entry.kind === "task" ? isTaskDone(entry.item) : isEventDone(entry.item),
    };
  });
}

// Días con actividad para los puntos del calendario: tareas, eventos y próxima fecha de cada
// pago recurrente activo.
export function selectMarkedDates({ tasks, events, recurrences }) {
  const dates = new Set();
  tasks.forEach((task) => dates.add(toDateKey(task.dueDate)));
  events.forEach((event) => {
    if (!isEventCanceled(event)) dates.add(toDateKey(event.eventDate));
  });
  recurrences
    .filter((recurrence) => recurrence.isActive)
    .forEach((recurrence) => dates.add(toDateKey(recurrence.nextScheduledDate)));
  dates.delete(null);
  return dates;
}

// Pendientes de pago (monto negativo) y de cobro (positivo), del más próximo al más lejano.
export function selectReminderGroups(reminders) {
  const sorted = [...reminders].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const out = sorted.filter((reminder) => Number(reminder.amount) < 0);
  const incoming = sorted.filter((reminder) => Number(reminder.amount) > 0);
  const sum = (list) => list.reduce((total, reminder) => total + Math.abs(Number(reminder.amount)), 0);
  return {
    out,
    in: incoming,
    outTotal: sum(out),
    inTotal: sum(incoming),
    lateCount: out.filter((reminder) => reminder.isOverdue).length,
  };
}

// Resumen del mes (GET /expenses/summary) con el reparto ingresos / gastos del flujo total.
export function selectFinance(summary) {
  if (!summary) return null;
  const income = Number(summary.income) || 0;
  const expenses = Number(summary.expenses) || 0;
  const flow = income + expenses;
  const incomePct = flow === 0 ? 0 : Math.round((income / flow) * 100);
  return {
    income,
    expenses,
    balance: Number(summary.balance) || 0,
    incomePct,
    expensePct: flow === 0 ? 0 : 100 - incomePct,
  };
}

function spentOn(expenses, dateKey) {
  return expenses
    .filter((expense) => Number(expense.amount) < 0 && toDateKey(expense.expenseDate) === dateKey)
    .reduce((total, expense) => total + Math.abs(Number(expense.amount)), 0);
}

// Gasto de los últimos 7 días (hoy incluido) y de los 7 anteriores, desde GET /expenses.
export function selectWeekExpenses(expenses, todayKey) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const key = addDays(todayKey, index - 6);
    return { key, label: WEEKDAYS_SHORT[parseDateKey(key).weekday], amount: spentOn(expenses, key) };
  });
  const previousTotal = Array.from({ length: 7 }, (_, index) => spentOn(expenses, addDays(todayKey, index - 13)))
    .reduce((total, amount) => total + amount, 0);
  const total = days.reduce((sum, day) => sum + day.amount, 0);
  return { days, total, previousTotal, diff: total - previousTotal };
}

// Saldo acumulado día a día del mes en curso (para la línea de "Disponible").
export function selectMonthBalance(expenses, todayKey) {
  const { year, month, day: today } = parseDateKey(todayKey);
  const lastDay = Math.min(today, daysInMonth(year, month));
  const byDay = new Array(lastDay + 1).fill(0);
  expenses.forEach((expense) => {
    const key = toDateKey(expense.expenseDate);
    if (!key) return;
    const date = parseDateKey(key);
    if (date.year === year && date.month === month && date.day <= lastDay) byDay[date.day] += Number(expense.amount) || 0;
  });
  let balance = 0;
  return byDay.map((amount) => {
    balance += amount;
    return balance;
  });
}
